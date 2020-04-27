package main

import (
	"log"
	"net/http"

	"github.com/daliyo/netspeedtest/speedtest"
)

func main() {

	//speedtest.ChangeCrossOrigin("*")

	http.Handle("/", http.FileServer(http.Dir("./")))
	http.Handle("/speedtest.js", http.FileServer(http.Dir("./")))
	http.Handle("/echarts.min.js", http.FileServer(http.Dir("./")))

	http.HandleFunc("/dl", speedtest.DownloadHandler) // test download speed
	http.HandleFunc("/up", speedtest.UploadHandler)   // test upload speed
	http.HandleFunc("/ping", speedtest.PingHandler)

	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatal(err)
	}
}
