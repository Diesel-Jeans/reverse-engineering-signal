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
                        console.log("[*] sendRequest [request]:", request);

                        if (request.body != null) {
                                appendToFile(logFile, `called sendRequest [request.body.text]: '${request}'\n`);
                                console.log("[*] sendRequest [request.body.text]:", request.body.value.data.holder.utf8());
                        }

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

        console.log("[*] Hooking SignalWebSocket...");
        const SignalWebSocket = Java.use("org.whispersystems.signalservice.api.SignalWebSocket");

        SignalWebSocket.requestToEnvelopeResponse.implementation = function(request) {
                console.log("[*] requestToEnvelopeResponse called!");

                // Log raw 
                appendToFile(logFile, `called requestToEnvelopeResponse [request.body]: '${request.body.value}'\n`);
                console.log("[*] request: ", request.body.value);

                // Create envelope
                const Envelope = Java.use("org.whispersystems.signalservice.internal.push.Envelope");
                let adapter = Envelope.ADAPTER.value;
                let bytearray = request.body.value.toByteArray();
                let envelope = adapter.decode(bytearray);

                // Log envelope
                appendToFile(logFile, `called requestToEnvelopeResponse [envelope]: '${envelope}'\n`);
                console.log("[*] envelope: ", envelope);

                // Overload the instantiation of envelope
                Envelope.$init.overload(
                        'org.whispersystems.signalservice.internal.push.Envelope$Type', // 1
                        'java.lang.String',  // 2
                        'java.lang.Integer', // 3
                        'java.lang.String',  // 4
                        'java.lang.Long',    // 5
                        'okio.ByteString',   // 6
                        'java.lang.String',  // 7
                        'java.lang.Long',    // 8
                        'java.lang.Boolean', // 9
                        'java.lang.Boolean', // 10
                        'okio.ByteString',   // 11
                        'okio.ByteString'    // 12
                ).implementation = function(
                        type_01,
                        destinationServiceId_02,
                        timestamp_03,
                        param_04,
                        serverGuid_05,
                        content_06,
                        urgent_07,
                        story_08,
                        param_09,
                        param_10,
                        param_11,
                        param_12) {
                                console.log("[*] Envelope created!");
                                
                                // Log envelope content
                                appendToFile(logFile, `called $init [envelope.content]: '${content_06.toByteArray()}'\n`);
                                console.log("[*] Envelope [Content]: " + content_06.toByteArray());

                                // Give control back
                                return this.$init(
                                        type_01,
                                        destinationServiceId_02,
                                        timestamp_03,
                                        param_04,
                                        serverGuid_05,
                                        content_06,
                                        urgent_07,
                                        story_08,
                                        param_09,
                                        param_10,
                                        param_11,
                                        param_12);
                        }

                // Give control back
                return this.requestToEnvelopeResponse(request);
        }

        console.log("[*] Hooking PushProcessMessageJob...");

        Java.enumerateLoadedClasses({
                onMatch: function(className) {
                        if (className.includes("org.thoughtcrime.securesms.jobs.PushProcessMessageJob$Companion")) {
                                console.log("[+] Found " + className);
                        }
                },
                onComplete: function() {
                        const PushProcessMessageJob = Java.use("org.thoughtcrime.securesms.jobs.PushProcessMessageJob$Companion");

                        const methods = PushProcessMessageJob.class.getDeclaredMethods();
                        methods.forEach(method => {
                                console.log("[+] Methods: " + method.toString());
                        });

                        PushProcessMessageJob.processOrDefer.implementation = function(messageProcessor, result, localReceiveMetric) {
                                console.log("[*] processOrDefer called!");

                                // Log
                                appendToFile(logFile, `called processOrDefer [result.content]: '${result.content.value}'\n`);
                                console.log("[*] processOrDefer [result.content]: ", result.content.value);

                                // Give control back
                                return this.processOrDefer(messageProcessor, result, localReceiveMetric);
                        }
                }
        });

        // console.log("[*] Hooking crypto");
        //
        // const SignalSessionCipher = Java.use("org.whispersystems.signalservice.api.crypto.SignalSessionCipher");
        //
        // SignalSessionCipher.decrypt.overload('org.signal.libsignal.protocol.message.SignalMessage').implementation = function(cipherText) {
        //         console.log("CipherText: ", cipherText);
        //
        //         return this.decrypt(cipherText);
        // }

        console.log("[*] Hooking completed.");
});

