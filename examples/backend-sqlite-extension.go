// Example of how to extend the backend to handle SQLite queries
// Note: This would require modifying the actual backend implementation

package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
	_ "github.com/mattn/go-sqlite3" // SQLite driver
)

// SQLiteQueryRequest represents a request to query SQLite
type SQLiteQueryRequest struct {
	Query string `json:"query"`
}

// SQLiteQueryResponse represents the query results
type SQLiteQueryResponse struct {
	Columns []string        `json:"columns"`
	Rows    [][]interface{} `json:"rows"`
	Error   string          `json:"error,omitempty"`
}

// handleSQLiteQuery would be added to the CallResource method
func (p *BusinessTextPlugin) handleSQLiteQuery(ctx context.Context, req *backend.CallResourceRequest, sender backend.CallResourceResponseSender) error {
	if req.Method != http.MethodPost {
		return sender.Send(&backend.CallResourceResponse{
			Status: http.StatusMethodNotAllowed,
			Body:   []byte("Method not allowed"),
		})
	}

	var queryReq SQLiteQueryRequest
	if err := json.Unmarshal(req.Body, &queryReq); err != nil {
		response := SQLiteQueryResponse{
			Error: fmt.Sprintf("Invalid request: %v", err),
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

	// Open SQLite database
	db, err := sql.Open("sqlite3", "/tmp/devices.db")
	if err != nil {
		response := SQLiteQueryResponse{
			Error: fmt.Sprintf("Failed to open database: %v", err),
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
	defer db.Close()

	// Execute query
	rows, err := db.QueryContext(ctx, queryReq.Query)
	if err != nil {
		response := SQLiteQueryResponse{
			Error: fmt.Sprintf("Query failed: %v", err),
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
	defer rows.Close()

	// Get column names
	columns, err := rows.Columns()
	if err != nil {
		response := SQLiteQueryResponse{
			Error: fmt.Sprintf("Failed to get columns: %v", err),
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

	// Collect results
	var results [][]interface{}
	for rows.Next() {
		values := make([]interface{}, len(columns))
		valuePtrs := make([]interface{}, len(columns))
		for i := range columns {
			valuePtrs[i] = &values[i]
		}

		if err := rows.Scan(valuePtrs...); err != nil {
			log.DefaultLogger.Error("Failed to scan row", "error", err)
			continue
		}

		results = append(results, values)
	}

	// Return results
	response := SQLiteQueryResponse{
		Columns: columns,
		Rows:    results,
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

// You would add this case to the CallResource switch statement:
// case "sqlite-query":
//     return p.handleSQLiteQuery(ctx, req, sender)