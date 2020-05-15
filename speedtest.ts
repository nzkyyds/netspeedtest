namespace speedtest {

    enum HTTP_METHOD {
        GET = "GET",
        POST = "POST",
    }

    enum BUFFER_SIZE {
        /** 1MB */
        KB = (1 << 10),
        /** 1KB */
        MB = (1 << 20),
    }

    class TestResult {
        /** 数据包总大小 字节*/
        total: number = 0;
        /** 开始测试的时间 */
        start: number = 0;
    }

    class ProgressObject extends TestResult {
        /** 当前时间 */
        now: number = 0;
        /** 已传输字节数 */
        loaded: number = 0;
        /** 带宽峰值 Mbps */
        peak: number = 0;
    }

    class LoadObject extends TestResult {
        /** 结束测试的时间 */
        end: number = 0;
        /** 已传输字节数 */
        loaded: number = 0;
        /** 测试总耗时 */
        elapsed: number = 0;
        /** 测算的带宽 Mbps */
        speed: number = 0;
        /** 带宽峰值 Mbps */
        peak: number = 0;
    }

    type ExtendProgressListenerEvent = (tester: ProgressObject) => void | null;
    type ExtendLoadListenerEvent = (tester: LoadObject) => void | null;

    const HOST = "",
        SERVICE_UPLOAD = "up",
        SERVICE_DOWNLOAD = "dl",
        SERVICE_PING = "ping";

    abstract class Tester {

        /** 数据包总大小 字节*/
        total: number = 0;
        /** 开始测试的时间 */
        start: number = 0;
        /** 当前时间 */
        now: number = 0;
        /** 结束测试的时间 */
        end: number = 0;
        /** 已传输字节数 */
        loaded: number = 0;
        /** 测试总耗时 */
        elapsed: number = 0;
        /** 测试得到的速率结果 Mbps */
        speed: number = 0;
        /** 带宽峰值 max Mbps */
        peak: number = 0;

        onprogress: ExtendProgressListenerEvent;
        onload: ExtendLoadListenerEvent;

        /**
         * timeoutListener
         */
        public timeoutListener(e: ProgressEvent<EventTarget>) {
            throw e;
        }

        /**
         * errorListener
         */
        public errorListener(e: ProgressEvent<EventTarget>) {
            throw e;
        }

        /**
         * loadstartListner
         */
        public loadstartListner(e: ProgressEvent<EventTarget>) {
            this.start = Date.now();
            if(e.currentTarget.toString() === "[object XMLHttpRequestUpload]"){
                this.total = e.total;
            }
        }

        /**
         * progressListener
         */
        public progressListener(e: ProgressEvent<EventTarget>) {
            let t = this.calcpeak(e.loaded);
            if (t > this.peak) {
                this.peak = t;
            }

            if (this.onprogress) {
                let o = new ProgressObject();
                o.start = this.start;
                o.loaded = this.loaded;
                o.now = this.now;
                o.peak = this.peak;
                o.total = this.total;
                ((this.onprogress).bind(o))();
            }
        }

        /**
         * loadListener
         */
        public loadListener(e: ProgressEvent<EventTarget>) {
            this.end = Date.now();
            this.calcspeed();
            this.print();

            if (this.onload) {
                let o = new LoadObject();
                o.elapsed = this.elapsed;
                o.end = this.end;
                o.loaded = this.loaded;
                o.peak = this.peak;
                o.speed = this.speed;
                o.start = this.start;
                o.total = this.total;
                ((this.onload).bind(o))();
            }
        }

        /**
         * calcpeak 计算峰值带宽
         * @param loaded 
         */
        public calcpeak(loaded) {
            this.loaded = loaded;
            this.now = Date.now();

            return parseFloat((this.loaded / ((this.now - this.start) / 1000) / BUFFER_SIZE.MB * 8).toFixed(2));
        }

        /**
         * calc
         */
        public calcspeed() {
            this.elapsed = this.end - this.start;
            this.speed = parseFloat((this.total / (this.elapsed / 1000) / BUFFER_SIZE.MB * 8).toFixed(2)); //Mbps
        }

        /**
         * do
         * @param onprogress 
         * @param onload 
         */
        abstract do(mega: number): void;

        /**
         * print
         */
        public print() {
            console.debug("done. speed:%sMbps, peak:%sMbps, time:%ss, %sKB/s",
                this.speed,
                this.peak,
                this.elapsed / 1000,
                Math.floor(this.total / (this.elapsed / 1000) / BUFFER_SIZE.KB));
        }

        /**
         * newhttp
         * @param method 请求方式
         * @param url 请求地址
         * @param async 是否异步请求. 默认启用
         */
        public newhttp(method: HTTP_METHOD, url: string, async: boolean = true): XMLHttpRequest {
            if (!url) {
                throw new Error("url is required.")
            }
            let http = new XMLHttpRequest();
            http.open(method, url, async);
            http.addEventListener("timeout", this.timeoutListener);
            http.addEventListener("error", this.errorListener);
            return http;
        }
    }

    export class UploadTester extends Tester {

        do(mega: number): void {
            let http = this.newhttp(HTTP_METHOD.POST, HOST + SERVICE_UPLOAD);
            http.upload.addEventListener("loadstart", (this.loadstartListner).bind(this));
            http.upload.addEventListener("progress", (this.progressListener).bind(this));
            http.upload.addEventListener("load", (this.loadListener).bind(this));

            let buffer = new ArrayBuffer(mega * BUFFER_SIZE.MB);
            http.send(buffer);
        }
    }

    export class DownloadTester extends Tester {

        do(mega: number): void {
            let searchParams = new URLSearchParams("");
            searchParams.append("r", Math.random().toString());
            searchParams.append("s", mega.toString());

            this.total = mega * BUFFER_SIZE.MB;

            let http = this.newhttp(HTTP_METHOD.GET, `${HOST + SERVICE_DOWNLOAD}?${searchParams.toString()}`);
            http.addEventListener("loadstart", (this.loadstartListner).bind(this));
            http.addEventListener("progress", (this.progressListener).bind(this));
            http.addEventListener("load", (this.loadListener).bind(this));
            http.send(null);
        }
    }
}