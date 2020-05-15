
#build stage
FROM golang:alpine AS builder
WORKDIR /go/src/app
COPY . .
ENV GOPROXY=https://goproxy.cn
RUN apk add --no-cache git
RUN go get -d -v ./...
RUN go install -v ./...

#final stage
FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /app
COPY --from=builder /go/bin/netspeedtest ./app
COPY --from=builder /go/src/app/speedtest.js .
COPY --from=builder /go/src/app/echarts.min.js .
COPY --from=builder /go/src/app/index.html .

ENTRYPOINT ./app
LABEL Name=netspeedtest Version=0.0.1
EXPOSE 3000
