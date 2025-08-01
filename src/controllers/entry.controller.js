const Entry = require("../models/Entry");
const CutConfig = require("../models/CutConfig");
const sendError = require("../utils/sendError");
const BlockNumber = require("../models/BlockNumber");
// import BlockNumber from "../models/BlockNumber.js";

exports.createLottery = async (req, res) => {
  try {
    const entries = req.body;
    if (!Array.isArray(entries)) {
      return sendError(res, "ข้อมูลที่ส่งมาไม่ถูกต้อง");
    }

    const latestConfig = await CutConfig.findOne().sort({ createdAt: -1 });
    if (!latestConfig) {
      return sendError(res, "ยังไม่มีการตั้งค่าการตัดเก็บ");
    }

    const blacklist = await BlockNumber.find().lean();
    const blacklistNumbers = blacklist
      .map((b) => b.number?.trim())
      .filter(Boolean);

    const results = [];

    const calcKeepSent = (amount, limit, isBlacklisted = false) => {
      if (isBlacklisted) {
        return {
          total: amount.toString(),
          kept: "0",
          sent: amount.toString(),
        };
      }
      const kept = Math.min(amount, limit);
      const sent = Math.max(amount - limit, 0);
      return {
        total: amount.toString(),
        kept: kept.toString(),
        sent: sent.toString(),
      };
    };

    for (const item of entries) {
      const { buyerName, number, top, tod, bottom } = item;
      if (!buyerName || !number) continue;

      const trimmedNumber = number.trim();
      const isBlacklisted = blacklistNumbers.includes(trimmedNumber);
      const numLength = trimmedNumber.length;
      const topAmount = parseFloat(top || "0");
      const todAmount = parseFloat(tod || "0");
      const bottomAmount = parseFloat(bottom || "0");

      const limitTop =
        numLength === 3
          ? parseFloat(latestConfig.threeDigitTop || "0")
          : parseFloat(latestConfig.twoDigitTop || "0");

      const limitTod =
        numLength === 3 ? parseFloat(latestConfig.threeDigitTod || "0") : 0;

      const limitBottom =
        numLength === 3
          ? parseFloat(latestConfig.threeDigitBottom || "0")
          : parseFloat(latestConfig.twoDigitBottom || "0");

      // เตรียม self entry (เฉพาะกรณีไม่ติด blacklist)
      let selfEntry = null;
      if (!isBlacklisted) {
        const entryFields = {
          buyerName,
          number: trimmedNumber,
          source: "self",
        };

        if (topAmount > 0) {
          entryFields[numLength === 3 ? "top" : "top2"] = calcKeepSent(
            topAmount,
            limitTop
          );
        }

        if (todAmount > 0 && numLength === 3) {
          entryFields["tod"] = calcKeepSent(todAmount, limitTod);
        }

        if (bottomAmount > 0) {
          entryFields[numLength === 3 ? "bottom3" : "bottom2"] = calcKeepSent(
            bottomAmount,
            limitBottom
          );
        }

        selfEntry = new Entry({
          ...entryFields,
          createdAtThai: formatThaiDatetime(new Date()),
        });
        await selfEntry.save();
      }

      // เตรียม dealer entry
      const dealerFields = {
        buyerName,
        number: trimmedNumber,
        source: "dealer",
      };

      const hasDealer = [];

      if (topAmount > limitTop || isBlacklisted) {
        dealerFields[numLength === 3 ? "top" : "top2"] = calcKeepSent(
          topAmount,
          limitTop,
          isBlacklisted
        );
        hasDealer.push(true);
      }

      if ((todAmount > limitTod && numLength === 3) || isBlacklisted) {
        dealerFields["tod"] = calcKeepSent(todAmount, limitTod, isBlacklisted);
        hasDealer.push(true);
      }

      if (bottomAmount > limitBottom || isBlacklisted) {
        dealerFields[numLength === 3 ? "bottom3" : "bottom2"] = calcKeepSent(
          bottomAmount,
          limitBottom,
          isBlacklisted
        );
        hasDealer.push(true);
      }

      let dealerEntry = null;
      if (hasDealer.length > 0) {
        dealerEntry = new Entry({
          ...dealerFields,
          createdAtThai: formatThaiDatetime(new Date()),
        });
        await dealerEntry.save();
      }

      results.push({
        self: selfEntry,
        dealer: dealerEntry,
        createdAtThai: (selfEntry || dealerEntry)?.createdAtThai,
      });
    }

    res.status(201).json({
      message: "บันทึกข้อมูลสำเร็จ",
      data: results,
    });
  } catch (err) {
    console.error("❌ ERROR:", err);
    sendError(res, "ไม่สามารถบันทึกข้อมูลหวยได้");
  }
};

exports.getByBuyer = async (req, res) => {
  try {
    const { buyerName } = req.params;
    const entries = await Entry.find({ buyerName }).sort({ createdAt: -1 });
    res.json({ data: entries });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "เกิดข้อผิดพลาด" });
  }
};

exports.deletePair = async (req, res) => {
  const { buyerName, number } = req.body;
  try {
    await Entry.deleteMany({ buyerName, number }); // ลบทั้ง self และ dealer
    res.status(200).json({ message: "ลบรายการสำเร็จ" });
  } catch (error) {
    res.status(500).json({ message: "ลบรายการไม่สำเร็จ", error });
  }
};

exports.getAll = async (req, res) => {
  try {
    const entries = await Entry.find().sort({ number: 1 }); // เรียงจากน้อยไปมาก (ascending)
    res.json({ data: entries });
  } catch (err) {
    res.status(500).json({ message: "เกิดข้อผิดพลาด" });
  }
};

exports.deleteEntry = async (req, res) => {
  try {
    const result = await Entry.deleteMany({});
    res.status(200).json({ message: "ลบข้อมูลทั้งหมดสำเร็จ", result });
  } catch (error) {
    res.status(500).json({ message: "เกิดข้อผิดพลาด", error });
  }
};

function formatThaiDatetime(date) {
  const d = new Date(date);
  const days = [
    "อาทิตย์",
    "จันทร์",
    "อังคาร",
    "พุธ",
    "พฤหัสบดี",
    "ศุกร์",
    "เสาร์",
  ];
  const months = [
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤศจิกายน",
    "ธันวาคม",
  ];
  const day = days[d.getDay()];
  const dateNum = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear() + 543;
  const hour = d.getHours().toString().padStart(2, "0");
  const minute = d.getMinutes().toString().padStart(2, "0");
  return `วัน${day}ที่ ${dateNum} ${month} ${year} เวลา ${hour}:${minute} น.`;
}

/**
 * exports.createLottery = async (req, res) => {
  try {
    const entries = req.body;
    if (!Array.isArray(entries)) {
      return sendError(res, "ข้อมูลที่ส่งมาไม่ถูกต้อง");
    }

    const latestConfig = await CutConfig.findOne().sort({ createdAt: -1 });

    const results = [];

    for (const item of entries) {
      const { buyerName, number, top, tod, bottom } = item;
      if (!buyerName || !number) continue;

      const numLength = number.trim().length;
      const topAmount = parseFloat(top || "0");
      const todAmount = parseFloat(tod || "0");
      const bottomAmount = parseFloat(bottom || "0");

      const limitTop =
        numLength === 3
          ? parseFloat(latestConfig?.threeDigitTop || "0")
          : parseFloat(latestConfig?.twoDigitTop || "0");

      const limitTod =
        numLength === 3 ? parseFloat(latestConfig?.threeDigitTod || "0") : 0;

      const limitBottom =
        numLength === 3
          ? parseFloat(latestConfig?.threeDigitBottom || "0")
          : parseFloat(latestConfig?.twoDigitBottom || "0");

      const calcKeepSent = (amount, limit) => {
        const kept = Math.min(amount, limit);
        const sent = Math.max(amount - limit, 0);
        return {
          total: amount.toString(),
          kept: kept.toString(),
          sent: sent.toString(),
        };
      };

      const entryFields = {
        buyerName,
        number,
        source: "self",
      };

      if (topAmount > 0) {
        entryFields[numLength === 3 ? "top" : "top2"] = calcKeepSent(
          topAmount,
          limitTop
        );
      }

      if (todAmount > 0 && numLength === 3) {
        entryFields["tod"] = calcKeepSent(todAmount, limitTod);
      }

      if (bottomAmount > 0) {
        entryFields[numLength === 3 ? "bottom3" : "bottom2"] = calcKeepSent(
          bottomAmount,
          limitBottom
        );
      }

      const selfEntry = new Entry({
        ...entryFields,
        createdAtThai: formatThaiDatetime(new Date()),
      });
      await selfEntry.save();

      const dealerFields = {
        buyerName,
        number,
        source: "dealer",
      };

      const hasDealer = [];

      if (topAmount > limitTop) {
        dealerFields[numLength === 3 ? "top" : "top2"] = calcKeepSent(
          topAmount,
          limitTop
        );
        hasDealer.push(true);
      }
      if (todAmount > limitTod && numLength === 3) {
        dealerFields["tod"] = calcKeepSent(todAmount, limitTod);
        hasDealer.push(true);
      }
      if (bottomAmount > limitBottom) {
        dealerFields[numLength === 3 ? "bottom3" : "bottom2"] = calcKeepSent(
          bottomAmount,
          limitBottom
        );
        hasDealer.push(true);
      }

      let dealerEntry = null;
      if (hasDealer.length > 0) {
        dealerEntry = new Entry({
          ...dealerFields,
          createdAtThai: formatThaiDatetime(new Date()),
        });
        await dealerEntry.save();
      }

      results.push({
        self: selfEntry,
        dealer: dealerEntry,
        createdAtThai: selfEntry.createdAtThai,
      });
    }

    res.status(201).json({
      message: "บันทึกข้อมูลสำเร็จ",
      data: results,
    });
  } catch (err) {
    console.error(err);
    sendError(res, "ไม่สามารถบันทึกข้อมูลหวยได้");
  }
};
 */
