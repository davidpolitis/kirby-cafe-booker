export const settings = {
    refreshDelay: 100,
    verboseMessages: false, // set to false to hide highly repeated messages, such as retrying
    shopID: 1, // 1 = Tokyo, 2 = Hakata
    yearMonth: "2024-05", // Month should be two digits. E.g. 2024-06
    // In order of preference. Day should be two digits, e.g. 05. Time should be 5 chars, e.g. 13:25. Kirby Cafe presently uses 15 minute session increments, from 10:00 to 20:30.
    dtRanges: [
        { day: "01", minTime: "13:25", maxTime: "20:30" },
        { day: "02", minTime: "13:25", maxTime: "20:30" },
        { day: "03", minTime: "13:25", maxTime: "20:30" }
    ],
    quantity: 2, // E.g. 2
    firstName: "John",
    lastName: "Smith",
    kanaFirstName: "ジョン",
    kanaLastName: "スミス",
    mobile: "0400000000",
    email: "johnsmith@exampledotcom",
    isBirthdayMonth: false,
    birthdayDessert: "",
    birthdayMessageType: "plain",
    birthdayMessageBody: "",
    birthdayMusic: false,
    allergies: "", // E.g. Shellfish, Peanuts or Tree nuts
    checkCalendarBeforeBooking: true // keep as true for now as less sus and potentially faster
};