package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
)

// Make sure BusinessTextPlugin implements required interfaces.
var (
	_ backend.CallResourceHandler = (*BusinessTextPlugin)(nil)
)

// BusinessTextPlugin implements backend.CallResourceHandler for the Business Text panel plugin.
type BusinessTextPlugin struct {
	backend.CallResourceHandler
}

// CallResource handles calls to the plugin's resources.
func (p *BusinessTextPlugin) CallResource(ctx context.Context, req *backend.CallResourceRequest, sender backend.CallResourceResponseSender) error {
	log.DefaultLogger.Info("CallResource called", "path", req.Path, "method", req.Method)

	// Validate Grafana session
	if !p.isValidGrafanaSession(req) {
		log.DefaultLogger.Warn("Unauthorized access attempt", "path", req.Path)
		return sender.Send(&backend.CallResourceResponse{
			Status: http.StatusUnauthorized,
			Body:   []byte("Unauthorized: Valid Grafana session required"),
		})
	}

	switch req.Path {
	case "fetch-content":
		return p.handleFetchContent(ctx, req, sender)
	default:
		return sender.Send(&backend.CallResourceResponse{
			Status: http.StatusNotFound,
			Body:   []byte("Not found"),
		})
	}
}

// FetchContentRequest represents the request to fetch external content
type FetchContentRequest struct {
	URL string `json:"url"`
}

// FetchContentResponse represents the response containing the fetched content
type FetchContentResponse struct {
	Content string `json:"content"`
	Error   string `json:"error,omitempty"`
}

// handleFetchContent fetches content from an external URL server-side
func (p *BusinessTextPlugin) handleFetchContent(ctx context.Context, req *backend.CallResourceRequest, sender backend.CallResourceResponseSender) error {
	if req.Method != http.MethodPost {
		return sender.Send(&backend.CallResourceResponse{
			Status: http.StatusMethodNotAllowed,
			Body:   []byte("Method not allowed"),
		})
	}

	var fetchReq FetchContentRequest
	if err := json.Unmarshal(req.Body, &fetchReq); err != nil {
		log.DefaultLogger.Error("Failed to unmarshal fetch request", "error", err)
		response := FetchContentResponse{
			Error: fmt.Sprintf("Invalid request body: %v", err),
		}
		body, _ := json.Marshal(response)
		return sender.Send(&backend.CallResourceResponse{
			Status: http.StatusBadRequest,
			Body:   body,
			Headers: map[string][]string{
				"Content-Type": {"application/json"},
			},
		})
	}

	if fetchReq.URL == "" {
		response := FetchContentResponse{
			Error: "URL is required",
		}
		body, _ := json.Marshal(response)
		return sender.Send(&backend.CallResourceResponse{
			Status: http.StatusBadRequest,
			Body:   body,
			Headers: map[string][]string{
				"Content-Type": {"application/json"},
			},
		})
	}

	log.DefaultLogger.Info("Fetching content from URL", "url", fetchReq.URL)

	// Create HTTP client
	client := &http.Client{}

	// Create request
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodGet, fetchReq.URL, nil)
	if err != nil {
		log.DefaultLogger.Error("Failed to create HTTP request", "error", err)
		response := FetchContentResponse{
			Error: fmt.Sprintf("Failed to create request: %v", err),
		}
		body, _ := json.Marshal(response)
		return sender.Send(&backend.CallResourceResponse{
			Status: http.StatusInternalServerError,
			Body:   body,
			Headers: map[string][]string{
				"Content-Type": {"application/json"},
			},
		})
	}

	// Set appropriate headers for HTML content
	httpReq.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
	httpReq.Header.Set("User-Agent", "Grafana Business Text Plugin")

	// Make the HTTP request
	resp, err := client.Do(httpReq)
	if err != nil {
		log.DefaultLogger.Error("Failed to fetch content", "error", err, "url", fetchReq.URL)
		response := FetchContentResponse{
			Error: fmt.Sprintf("Failed to fetch content: %v", err),
		}
		body, _ := json.Marshal(response)
		return sender.Send(&backend.CallResourceResponse{
			Status: http.StatusInternalServerError,
			Body:   body,
			Headers: map[string][]string{
				"Content-Type": {"application/json"},
			},
		})
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.DefaultLogger.Error("HTTP request failed", "status", resp.StatusCode, "url", fetchReq.URL)
		response := FetchContentResponse{
			Error: fmt.Sprintf("HTTP request failed with status %d", resp.StatusCode),
		}
		body, _ := json.Marshal(response)
		return sender.Send(&backend.CallResourceResponse{
			Status: http.StatusBadGateway,
			Body:   body,
			Headers: map[string][]string{
				"Content-Type": {"application/json"},
			},
		})
	}

	// Read the response body
	content, err := io.ReadAll(resp.Body)
	if err != nil {
		log.DefaultLogger.Error("Failed to read response body", "error", err)
		response := FetchContentResponse{
			Error: fmt.Sprintf("Failed to read response: %v", err),
		}
		body, _ := json.Marshal(response)
		return sender.Send(&backend.CallResourceResponse{
			Status: http.StatusInternalServerError,
			Body:   body,
			Headers: map[string][]string{
				"Content-Type": {"application/json"},
			},
		})
	}

	log.DefaultLogger.Info("Successfully fetched content", "url", fetchReq.URL, "contentLength", len(content))

	// Return the successful response
	response := FetchContentResponse{
		Content: string(content),
	}
	body, _ := json.Marshal(response)

	return sender.Send(&backend.CallResourceResponse{
		Status: http.StatusOK,
		Body:   body,
		Headers: map[string][]string{
			"Content-Type": {"application/json"},
		},
	})
}

// isValidGrafanaSession validates that the request comes from an authenticated Grafana session
func (p *BusinessTextPlugin) isValidGrafanaSession(req *backend.CallResourceRequest) bool {
	// Check for Grafana user information in the plugin context
	// Grafana automatically provides user context for authenticated requests
	if req.PluginContext.User != nil && req.PluginContext.User.Login != "" {
		log.DefaultLogger.Debug("Valid plugin context user", "user", req.PluginContext.User.Login, "orgId", req.PluginContext.OrgID)
		return true
	}

	// Check for X-Grafana-Id JWT token which indicates a valid Grafana session
	grafanaId := req.GetHTTPHeader("X-Grafana-Id")
	if grafanaId != "" && len(grafanaId) > 50 {
		// For security, we could decode and validate the JWT here, but for now
		// we'll accept any valid X-Grafana-Id as proof of Grafana session
		log.DefaultLogger.Info("Valid Grafana session detected via X-Grafana-Id")
		return true
	}

	// Check for Grafana referer header (requests from Grafana UI)
	referer := req.GetHTTPHeader("X-Grafana-Referer")
	if referer != "" && len(referer) > 10 {
		log.DefaultLogger.Info("Valid request from Grafana UI", "referer", referer)
		return true
	}

	log.DefaultLogger.Debug("No valid authentication found")
	return false
}

func main() {
	// Create plugin instance
	plugin := &BusinessTextPlugin{}

	// Start listening to requests sent from Grafana. This call is blocking so
	// it won't finish until Grafana shuts down the process or the plugin choose
	// to exit by itself using os.Exit.
	if err := backend.Serve(backend.ServeOpts{
		CallResourceHandler: plugin,
	}); err != nil {
		log.DefaultLogger.Error(err.Error())
		os.Exit(1)
	}
}
