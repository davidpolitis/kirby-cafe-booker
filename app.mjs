"use strict";

import { settings } from "./settings.mjs";

(async () => {
    let success = false;

    const referrer = "https://kirbycafe-reserve.com/guest/" + (settings.shopID == 1 ? "tokyo" : "hakata") + "/reserve/";
    const headers = {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:122.0) Gecko/20100101 Firefox/122.0",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.5",
        "Content-Type": "application/json;charset=utf-8",
        "X-KBCF": "kbcf",
        "X-Language": "en",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin"
    };

    retryLoop: while (!success) {
        if (settings.checkCalendarBeforeBooking) {
            // get time slots for month
            const calendarRes = await fetch("https://kirbycafe-reserve.com/api/guest/reserve/calendar?shop_id=" + settings.shopID + "&month=" + settings.yearMonth + "&quantity=" + settings.quantity, {
                "credentials": "include",
                "headers": headers,
                "referrer": referrer,
                "method": "GET",
                "mode": "cors"
            });

            if (calendarRes.ok) {
                const calendar = (await calendarRes.json()).calendar;

                if (settings.verboseMessages)
                    console.log("Fetched calendar");
            
                // loop over days
                for (const dtRange of settings.dtRanges) {
                    prefixDateTimeWithZero(dtRange);
                    const date = settings.yearMonth + "-" + dtRange.day; // example val: 2024-03-15
                    const allTimes = calendar[date];
                    
                    // try book times that are >= minTime && <= maxTime
                    for (const [time, quantity] of Object.entries(allTimes)) {
                        const startDateTime = date + " " + time; // example val: 2024-03-15 20:15
                        if (Date.parse(startDateTime) > Date.now() && time >= dtRange.minTime && time <= dtRange.maxTime && quantity >= settings.quantity) {
                            console.log(quantity + " seat" + (quantity > 1 ? "s" : "") + " free for " + startDateTime);
                            success = await tryBooking(startDateTime);
                            if (success) {
                                console.log("SUCCESS: Booked " + settings.quantity + " seat" + (quantity > 1 ? "s" : "") + " for " + startDateTime);
                                break retryLoop;
                            }
                        }
                    }
                }
            }
            else {
                if (settings.verboseMessages)
                    console.log("Failed to fetch calendar - " + calendarRes.statusText + " - " + (await calendarRes.json()).message);
            }
        }
        else {
            const allTimes = [
                "10:00",
                "10:15",
                "10:30",
                "10:45",
                "11:00",
                "11:35",
                "11:50",
                "12:05",
                "12:20",
                "12:35",
                "13:10",
                "13:25",
                "13:40",
                "13:55",
                "14:10",
                "14:45",
                "15:00",
                "15:15",
                "15:30",
                "15:45",
                "16:20",
                "16:35",
                "16:50",
                "17:05",
                "17:20",
                "17:55",
                "18:10",
                "18:25",
                "18:40",
                "18:55",
                "19:30",
                "19:45",
                "20:00",
                "20:15",
                "20:30"
            ];
    
            // loop over days
            for (const dtRange of settings.dtRanges) {
                prefixDateTimeWithZero(dtRange);
                const date = settings.yearMonth + "-" + dtRange.day; // example val: 2024-03-15
                // try book times that are >= minTime && <= maxTime
                for (const time of allTimes) {
                    const startDateTime = date + " " + time; // example val: 2024-03-15 20:15
                    if (Date.parse(startDateTime) > Date.now() && time >= dtRange.minTime && time <= dtRange.maxTime) {
                        success = await tryBooking(startDateTime);
                        if (success) {
                            console.log("SUCCESS: Booked " + settings.quantity + " seats for " + startDateTime);
                            break retryLoop;
                        }
                    }
                }
            }
        }
    
        if (settings.verboseMessages) {
            console.log(`FAILURE: Could not book for any specified days. Retrying in ${settings.refreshDelay}ms!`);
        }
    
        await sleep(settings.refreshDelay);
    }
    
    function sleep(ms) {
        return new Promise((resolve) => {
          setTimeout(resolve, ms);
        });
    }

    // ensure single digit hours are prefixed with 0, otherwise time comparisons don't work correctly
    function prefixDateTimeWithZero(dtRange) {
        if (dtRange.minTime.length == 4) {
            dtRange.minTime = "0" + dtRange.minTime;
        }
        if (dtRange.maxTime.length == 4) {
            dtRange.maxTime = "0" + dtRange.maxTime;
        }
    }

    async function tryBooking(startDateTime) {
        const keepRes = await fetch("https://kirbycafe-reserve.com/api/guest/reserve/keep", {
            "credentials": "omit",
            "headers": headers,
            "referrer": referrer,
            "body": JSON.stringify({
                shop_id: settings.shopID,
                start_at: startDateTime,
                quantity: settings.quantity
            }),
            "method": "POST",
            "mode": "cors"
        });
    
        if (keepRes.ok) {
            const token = (await keepRes.json()).token;
            console.log("Obtained token for " + startDateTime + ": " + token);

            const reserveBody = JSON.stringify({
                reserver: {
                    name_l: settings.lastName,
                    name_f: settings.firstName,
                    kana_l: settings.kanaLastName,
                    kana_f: settings.kanaFirstName,
                    mobile: settings.mobile,
                    email: settings.email,
                    has_birthday: settings.isBirthdayMonth ? 1 : 0,
                    birthday_dessert: settings.birthdayDessert,
                    birthday_message_type: settings.birthdayMessageType,
                    birthday_message_body: settings.birthdayMessageBody,
                    birthday_music_type: settings.birthdayMusic ? "play_music" : "no_music",
                    remark: settings.allergies,
                    receive_information: false,
                    lang: "en"
                },
                token: token
            });

            // confirm
            const confirmRes = await fetch("https://kirbycafe-reserve.com/api/guest/reserve/confirm", {
                "credentials": "omit",
                "headers": headers,
                "referrer": referrer,
                "body": reserveBody,
                "method": "PUT",
                "mode": "cors"
            });

            if (confirmRes.ok) {
                return true;
            }
            else {
                console.log("Failed to confirm reservation - " + confirmRes.statusText);
            }
        }
    
        return false;
    }
})();