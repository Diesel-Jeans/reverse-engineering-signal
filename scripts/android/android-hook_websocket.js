
function appendToFile(filePath, string) {
        var String = Java.use('java.lang.String');
        var FileOutputStream = Java.use('java.io.FileOutputStream');

        try {
                var stream = FileOutputStream.$new(filePath, true);
                var bytes = String.$new(string + '\n').getBytes();
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
        let logFile = "/storage/emulated/0/signal-websocket.log";

        console.log("[*] Hooking OkHttpWebSocketConnection...");

        const OkHttpWebSocketConnection = Java.use("org.whispersystems.signalservice.internal.websocket.OkHttpWebSocketConnection");

        OkHttpWebSocketConnection.sendRequest.implementation = function(request) {
                console.log("[*] sendRequest called!");

                // var WebSocketMessage = Java.use("org.whispersystems.signalservice.internal.websocket.WebSocketMessage");
                // var Builder = Java.use("org.whispersystems.signalservice.internal.websocket.WebSocketMessage$Builder");
                //
                // // Load the WebSocketMessage$Type class and select the "REQUEST" type
                // var WebSocketMessageType = Java.use("org.whispersystems.signalservice.internal.websocket.WebSocketMessage$Type");
                // var requestType = WebSocketMessageType.REQUEST.value;
                //
                // // Create an instance of WebSocketRequestMessage (or replace with an existing instance)
                // var WebSocketRequestMessage = Java.use("org.whispersystems.signalservice.internal.websocket.WebSocketRequestMessage");
                // var requestInstance = WebSocketRequestMessage.$new();
                //
                // // Create the Builder instance and set its properties
                // var builder = Builder.$new(); // Create the builder
                // builder.type(requestType);    // Set type to REQUEST
                // builder.request(requestInstance); // Set the request instance
                //
                // // Build the WebSocketMessage
                // var webSocketMessage = builder.build();

                // Log the constructed WebSocketMessage
                // console.log("[****] WebSocketMessage constructed:", webSocketMessage);

                try {
                        // Log
                        let logging = request.toString();
                        console.log("[*] WebSocketRequestMessage:", logging);
                        appendToFile(logFile, logging);

                        // Call original method
                        const res = this.sendRequest(request);
                        console.log("[*] Method response:", res);

                        // Give control back
                        return res;
                } catch (e) {
                        console.error("[!] Exception in sendRequest:", e);
                        throw e;
                }
        };

        OkHttpWebSocketConnection.sendResponse.implementation = function(response) {
                console.log("[*] sendResponse called!");

                try {
                        // Log
                        let logging = response.toString();
                        console.log("[*] WebSocketResponseMessage:", logging);
                        appendToFile(logFile, logging);

                        // Call original method
                        const res = this.sendResponse(response);
                        console.log("[*] Method response:", res);

                        // Give control back
                        return res;
                } catch (e) {
                        console.error("[!] Exception in sendRequest:", e);
                        throw e;
                }
        };

        OkHttpWebSocketConnection.onMessage.overload('okhttp3.WebSocket', 'okio.ByteString').implementation = function(webSocket, payload) {
                console.log("[*] onMessage called!");

                var WebSocketMessage = Java.use("org.whispersystems.signalservice.internal.websocket.WebSocketMessage");
                var adapter = WebSocketMessage.ADAPTER.value;
                // var ByteString = Java.use("okio.ByteString");
                var byteArray = payload.toByteArray();
                var message = adapter.decode(byteArray);

                console.log("[!!!!] Decoded WebSocketMessage:", message);

                try {
                        // // Log 
                        // let logging = webSocket.queueSize().toString();
                        // appendToFile(logFile, "queueSize: " + logging);
                        //
                        // logging = webSocket.request().toString();
                        // appendToFile(logFile, "request: \n" + logging);
                        //
                        // logging = payload;
                        // appendToFile(logFile, "payload: \n" + logging);

                        // Call original method
                        const res = this.onMessage(webSocket, payload);
                        console.log("[*] Method response:", res);

                        // Give control back
                        return res;
                } catch (e) {
                        console.error("[!] Exception in sendRequest:", e);
                        throw e;
                }
        };

        console.log("[*] Hooking completed.");
});

