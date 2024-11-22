# reverse-engineering-signal

## Prerequisites
* Rooted android device or emulator witout Play Store
* [Proxyman](https://proxyman.io)
* [Frida](https://github.com/frida/frida)
* [Signal-Android apk](https://github.com/signalapp/Signal-Android)

## Setup
* Pixel 6 API 35 - Android 8.0 x86
* Signal-Android-website-prod-universal-release-7.25.0.apk
* frida-server-16.5.7-android-x86

## How to run
### 1. Prepare host
* `pip install frida-tools`
* Export proxyman certificate
    * certificate > Export > Root Certificate as DER > Save as `cert-der-proxyman.crt`
### 2. Prepare device
* Drag and drop `cert-der-proxyman.crt` into emulator
    * Install in settings `CA Certificates`.
* Drag and drop `Signal-Android APK` into emulator to install
* Send frida-server to device
    * `adb shell getprop ro.product.cpu.abi` to get arch
    * `adb push frida-server-16.5.7-android-x86 /data/local/tmp/frida-server`
    * `adb shell chmod 755 /data/local/tmp/frida-server`
* Set proxy hostname and proxy port in android

### 3. Edit config.js
In `/frida-interception-and-unpinning/config.js`
* Set `CERT_PEM` to content of `cert-der-proxyman.crt`
* Set `PROXY_HOST` and `PROXY_PORT` to match Proxyman

### 3. Run frida scripts
Disable SSL pinning for `Signal-Android` to view decrypted HTTPS packages and log websocket data
* Open Proxyman
* Run `emulator -avd Pixel_6_API_35`

Start `frida-server`
```bash
adb root
adb shell /data/local/tmp/frida-server
```

Execute scripts using `frida-server`
* Get Signal identifyer `frida-ps -Ua`
```bash
frida -U \
    -l ./frida-interception-and-unpinning/config.js \
    -l ./frida-interception-and-unpinning/native-connect-hook.js \
    -l ./frida-interception-and-unpinning/native-tls-hook.js \
    -l ./frida-interception-and-unpinning/android/android-proxy-override.js \
    -l ./frida-interception-and-unpinning/android/android-system-certificate-injection.js \
    -l ./frida-interception-and-unpinning/android/android-certificate-unpinning.js \
    -l ./frida-interception-and-unpinning/android/android-certificate-unpinning-fallback.js \
    -l ./scripts/android/android-hook_websocket.js \
    -f org.thoughtcrime.securesms
```

### 4. View decrypted HTTPS and websocket log
Proxyman shows decrypted HTTPS request/response
* Get websocket log from android device `adb pull /storage/emulated/0/signal-websocket.log .`