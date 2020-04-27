//Package speedtest The package implements the function of testing the network speed from the client to the server
package speedtest

import (
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	"strconv"
	"strings"
)

var (
	bufferLimit              = 50 // Test file limit 50MB
	accessControlAllowOrigin = "*"
)

// PingHandler Test network latency
func PingHandler(w http.ResponseWriter, r *http.Request) {

	if checkRequestMethod(r, http.MethodHead, http.MethodGet) {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	setAccessControlAllowOrigin(w)
	w.WriteHeader(http.StatusNoContent)
}

// UploadHandler Test data upload speed
func UploadHandler(w http.ResponseWriter, r *http.Request) {

	if !checkRequestMethod(r, http.MethodHead, http.MethodPost) {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	setAccessControlAllowOrigin(w)

	v, ok := r.Header["Content-Length"]
	if !ok || len(v) < 1 {
		w.WriteHeader(http.StatusBadRequest)
		io.WriteString(w, "The field Content-Length was not found in the request header")
		return
	}

	l, err := strconv.Atoi(v[0])
	if err != nil || l > calcBufferSize(bufferLimit) {
		w.WriteHeader(http.StatusBadRequest)
		io.WriteString(w, "Request data is too large")
		return
	}

	buff, err := ioutil.ReadAll(r.Body)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	fmt.Println(len(buff))

	w.WriteHeader(http.StatusNoContent)
}

// DownloadHandler Test data download speed
func DownloadHandler(w http.ResponseWriter, r *http.Request) {

	if !checkRequestMethod(r, http.MethodHead, http.MethodGet) {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	setAccessControlAllowOrigin(w)

	bufferSize := calcBufferSize(30) //default 30MB
	if s, ok := r.URL.Query()["s"]; ok {
		if len(s) > 0 {
			if requestSize, err := strconv.Atoi(s[0]); err == nil && requestSize <= calcBufferSize(bufferLimit) {
				bufferSize = calcBufferSize(requestSize)
			}
		}
	}

	buff := make([]byte, bufferSize)
	w.Header().Add("Content-Length", strconv.Itoa(bufferSize))
	w.Write(buff)
}

// ChangeBufferLimit Change data limit for testing download speed
//
// limit: data unit MB, default 50MB
func ChangeBufferLimit(limit int) {
	bufferLimit = limit
}

// ChangeCrossOrigin Change the cross-domain restriction in the response header
//
// origin: default *
func ChangeCrossOrigin(origin string) {
	accessControlAllowOrigin = origin
}

func calcBufferSize(megabytes int) int {
	return megabytes * (1 << 20) // megabytes * 1MB
}

func setAccessControlAllowOrigin(w http.ResponseWriter) {
	w.Header().Add("Access-Control-Allow-Origin", accessControlAllowOrigin)
}

func checkRequestMethod(r *http.Request, allowMethods ...string) bool {
	target := strings.ToUpper(r.Method)
	for _, v := range allowMethods {
		if target == v {
			return true
		}
	}
	return false
}
