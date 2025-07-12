//go:build mage
// +build mage

package main

import (
	"fmt"
	"path/filepath"

	"github.com/magefile/mage/mg"
	"github.com/magefile/mage/sh"
)

// Default target to run when none is specified
// If not set, running mage will list available targets
var Default = BuildAll

const (
	// Plugin name
	pluginName = "business-text"
	// Go binary name
	binaryName = "gpx_business-text"
)

// BuildAll builds the frontend and backend of the plugin
func BuildAll() {
	mg.Deps(BuildBackend, BuildFrontend)
}

// BuildBackend builds the backend binary
func BuildBackend() error {
	fmt.Println("Building backend...")

	env := map[string]string{
		"CGO_ENABLED": "0",
	}

	// Build for current OS/arch
	ldflags := "-w -s"

	args := []string{
		"build",
		"-ldflags", ldflags,
		"-o", filepath.Join("dist", binaryName),
		"./pkg",
	}

	return sh.RunWith(env, "go", args...)
}

// BuildFrontend builds the frontend
func BuildFrontend() error {
	fmt.Println("Building frontend...")

	// Check if we have npm or yarn
	if exists("yarn") {
		return sh.Run("yarn", "build")
	} else if exists("npm") {
		return sh.Run("npm", "run", "build")
	} else if exists("pnpm") {
		return sh.Run("pnpm", "build")
	}

	return fmt.Errorf("no package manager found (npm, yarn, or pnpm)")
}

// Clean removes build artifacts
func Clean() error {
	fmt.Println("Cleaning...")
	return sh.Rm("dist")
}

// Test runs the tests
func Test() error {
	fmt.Println("Running tests...")
	return sh.Run("go", "test", "./...")
}

// exists checks if a binary exists in PATH
func exists(cmd string) bool {
	_, err := sh.Output("which", cmd)
	return err == nil
}

// BuildLinux builds the backend for Linux
func BuildLinux() error {
	fmt.Println("Building backend for Linux...")

	env := map[string]string{
		"CGO_ENABLED": "0",
		"GOOS":        "linux",
		"GOARCH":      "amd64",
	}

	ldflags := "-w -s"

	args := []string{
		"build",
		"-ldflags", ldflags,
		"-o", filepath.Join("dist", binaryName+"_linux_amd64"),
		"./pkg",
	}

	return sh.RunWith(env, "go", args...)
}

// BuildWindows builds the backend for Windows
func BuildWindows() error {
	fmt.Println("Building backend for Windows...")

	env := map[string]string{
		"CGO_ENABLED": "0",
		"GOOS":        "windows",
		"GOARCH":      "amd64",
	}

	ldflags := "-w -s"

	args := []string{
		"build",
		"-ldflags", ldflags,
		"-o", filepath.Join("dist", binaryName+"_windows_amd64.exe"),
		"./pkg",
	}

	return sh.RunWith(env, "go", args...)
}

// BuildDarwin builds the backend for macOS
func BuildDarwin() error {
	fmt.Println("Building backend for macOS...")

	env := map[string]string{
		"CGO_ENABLED": "0",
		"GOOS":        "darwin",
		"GOARCH":      "amd64",
	}

	ldflags := "-w -s"

	args := []string{
		"build",
		"-ldflags", ldflags,
		"-o", filepath.Join("dist", binaryName+"_darwin_amd64"),
		"./pkg",
	}

	return sh.RunWith(env, "go", args...)
}

// BuildAllPlatforms builds for all supported platforms
func BuildAllPlatforms() {
	mg.Deps(BuildLinux, BuildWindows, BuildDarwin)
}
