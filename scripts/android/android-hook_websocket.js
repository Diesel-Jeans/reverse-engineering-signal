function appendToFile(filePath, string) {
        var String = Java.use('java.lang.String');
        var FileOutputStream = Java.use('java.io.FileOutputStream');

        try {
                let timestamp = new Date().toISOString();
                var stream = FileOutputStream.$new(filePath, true);
                var bytes = String.$new(`${timestamp} - ${string}\n`).getBytes();
                stream.write(bytes);
                stream.close();
                console.log("[*] Wrote to", filePath);
        } catch (e) {
                console.log("Error: ", e);
        }
}

function printLoadedClasses(filter) {
        var classes = Java.enumerateLoadedClassesSync();
        console.log("[***] ClassName Start [***]");
        classes.forEach(function(className) {
                if (className.includes(filter)) {
                        console.log(className);
                }
        });
        console.log("[***] ClassName End [***]");
}

Java.perform(function() {
        let logFile = "/storage/emulated/0/signal-websocket.yml";

        console.log("[*] Hooking OkHttpWebSocketConnection...");
        const OkHttpWebSocketConnection = Java.use("org.whispersystems.signalservice.internal.websocket.OkHttpWebSocketConnection");

        OkHttpWebSocketConnection.sendRequest.implementation = function(request) {
                console.log("[*] sendRequest called!");

                try {
                        // Log
                        appendToFile(logFile, `called sendRequest [request]: '${request}'\n`);
                        console.log("[*] sendRequest [request:", request);

                        // Give control back
                        return this.sendRequest(request);

                } catch (e) {
                        console.error("[!] Exception in sendRequest:", e);
                        throw e;
                }
        };

        OkHttpWebSocketConnection.sendResponse.implementation = function(response) {
                console.log("[*] sendResponse called!");

                try {
                        // Log
                        appendToFile(logFile, `called sendResponse [response]: '${response}'\n`);
                        console.log("[*] sendResponse:", response);

                        // Give control back
                        return this.sendResponse(response);
                } catch (e) {
                        console.error("[!] Exception in sendResponse:", e);
                        throw e;
                }
        };

        OkHttpWebSocketConnection.onMessage.overload('okhttp3.WebSocket', 'okio.ByteString').implementation = function(webSocket, payload) {
                console.log("[*] onMessage called!");

                try {
                        // Create webSocketMessage
                        var WebSocketMessage = Java.use("org.whispersystems.signalservice.internal.websocket.WebSocketMessage");
                        var adapter = WebSocketMessage.ADAPTER.value;
                        var byteArray = payload.toByteArray();
                        var message = adapter.decode(byteArray);

                        // Log 
                        appendToFile(logFile, `called onMessage [webSocketMessage]: '${message}'\n`);
                        console.log("[*] webSocketMessage [webSocketMessage]:", message);

                        appendToFile(logFile, `called onMessage [payload]: '${payload}'\n`);
                        console.log("[*] payload:", payload);

                        // Give control back
                        return this.onMessage(webSocket, payload);
                } catch (e) {
                        console.error("[!] Exception in onMessage:", e);
                        throw e;
                }
        };

        console.log("[*] Hooking SingalServiceMessageSender...");
        const SignalServiceMessageSender = Java.use("org.whispersystems.signalservice.api.SignalServiceMessageSender");

        SignalServiceMessageSender.sendContent.implementation = function(recipient, sealedSenderAccess, contentHint, message, sendEvents, urgent, includePniSignature, content) {
                console.log("[*] sendContent called!");

                try {
                        // Log
                        appendToFile(logFile, `called sendContent [content]: '${content}'\n`);
                        console.log("[*] content:", content);

                        // Give control back
                        return this.sendContent(recipient, sealedSenderAccess, contentHint, message, sendEvents, urgent, includePniSignature, content);
                } catch (e) {
                        console.error("[!] Exception in sendContent:", e);
                        throw e;
                }
        };

        console.log("[*] Hooking completed.");
});

