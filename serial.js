let port;
let reader;
let inputDone;
let outputDone;
let inputStream;
let outputStream;

const baudrates = [9600, 19200, 38400, 57600, 115200];

function initializeBaudrateSelect() {
  const baudrateSelect = document.getElementById("baudrate");
  baudrates.forEach((rate) => {
    const option = document.createElement("option");
    option.value = rate;
    option.textContent = rate;
    baudrateSelect.appendChild(option);
  });
}

async function connectToDevice() {
  const baudrateSelect = document.getElementById("baudrate");
  try {
    port = await navigator.serial.requestPort();
    const baudRate = parseInt(baudrateSelect.value);
    await port.open({ baudRate: baudRate });

    const encoder = new TextEncoderStream();
    outputDone = encoder.readable.pipeTo(port.writable);
    outputStream = encoder.writable;

    let decoder = new TextDecoderStream();
    inputDone = port.readable.pipeTo(decoder.writable);
    inputStream = decoder.readable;

    reader = inputStream.getReader();
    readLoop();

    document.getElementById("connect").disabled = true;
    document.getElementById("disconnect").disabled = false;
  } catch (error) {
    console.error("連接錯誤:", error);
  }
}

async function disconnectFromDevice() {
  if (reader) {
    await reader.cancel();
    await inputDone.catch(() => {});
    reader = null;
    inputDone = null;
  }

  if (outputStream) {
    await outputStream.getWriter().close();
    await outputDone;
    outputStream = null;
    outputDone = null;
  }

  await port.close();
  port = null;

  document.getElementById("connect").disabled = false;
  document.getElementById("disconnect").disabled = true;
}

async function readLoop() {
  while (true) {
    const { value, done } = await reader.read();
    if (value) {
      document.getElementById("output").textContent += value;
    }
    if (done) {
      console.log("讀取完成");
      reader.releaseLock();
      break;
    }
  }
}

async function writeToStream(data) {
  const writer = outputStream.getWriter();
  await writer.write(data);
  writer.releaseLock();
}

// 導出函數供 HTML 使用
window.initializeBaudrateSelect = initializeBaudrateSelect;
window.connectToDevice = connectToDevice;
window.disconnectFromDevice = disconnectFromDevice;
window.writeToStream = writeToStream;
