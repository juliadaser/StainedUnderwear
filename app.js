import express from "express";
import { SerialPort } from "serialport";
import { ReadlineParser } from "@serialport/parser-readline";

import { fileURLToPath } from "url";
import { dirname } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

var app = express();

app.use(express.static(__dirname));

var dayNum = 0;

// data = dayNumber: [{time: [hour, number]}, amountOfScrubs]
const data = {
  0: [{ time: [10, 0o1] }, 30],
  1: [{ time: [8, 45] }, 30],
  2: [{ time: [9, 22] }, 70],
  3: [{ time: [11, 44] }, 50],
  4: [{ time: [9, 53] }, 11],
  5: [{ time: [10, 43] }, 50],
  6: [{ time: [10, 39] }, 10],
  7: [{ time: [8, 51] }, 200],
  8: [{ time: [11, 28] }, 20],
  9: [{ time: [10, 56] }, 30],
  10: [{ time: [9, 34] }, 35],
  11: [{ time: [8, 14] }, 60],
};

const port = new SerialPort({ path: "/dev/cu.usbmodem11201", baudRate: 9600 });
const parser = port.pipe(new ReadlineParser({ delimiter: "\r\n" }));
parser.on("data", console.log);

app.get("/", function (req, res) {
  res.sendFile("index.html", { root: __dirname });
});

app.get("/on", function (req, res) {
  res.sendFile("on.html", { root: __dirname });
  port.write("H", function (err) {
    if (err) {
      return console.log("Error on write: ", err.message);
    }
    console.log("led was turned on");
  });
});

app.get("/off", function (req, res) {
  res.sendFile("off.html", { root: __dirname });
  port.write("L", function (err) {
    if (err) {
      return console.log("Error on write: ", err.message);
    }
    console.log("led was turned off");
  });
});

setInterval(() => {
  const currentTime = new Date();
  const formattedHours = currentTime.toLocaleTimeString("en-US", {
    hour12: true,
  });
  const splitTime = formattedHours.split(":");

  // moving to the next day on midnight
  if (
    currentTime.getHours() === 0 &&
    currentTime.getMinutes() === 0 &&
    currentTime.getSeconds() === 0
  ) {
    dayNum++;
  }

  if (
    //hours (using conversion from military to AM/PM)
    Number(splitTime[0]) === data[dayNum][0].time[0] &&
    // minutes (also using military time)
    Number(splitTime[1]) === data[dayNum][0].time[1] &&
    // seconds (using regular time bc it doesnt matter)
    currentTime.getSeconds() === 0
  ) {
    port.write(String(dayNum), function (err) {
      if (err) {
        return console.log("Error on write: ", err.message);
      }
      console.log("TIME TRIGGER");
    });
  }
}, 1000);

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log("Example app listening at http://%s:%s", host, port);
});
