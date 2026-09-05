/*
  dummy-data.js

  Placeholder queue data for the SmartQ concept demo.
  In the finished system this would be replaced by data
  fetched from the Python/MySQL backend.
*/

const dummyTickets = [
  {
    ticketNumber: "A-018",
    name: "Hanan Ramanna",
    studentNumber: "402412389",
    phone: "082 123 4567",
    query: "Access Card",
    status: "served",
    submittedAt: "2026-09-04T08:02:00"
  },
  {
    ticketNumber: "A-019",
    name: "Thabo Nkosi",
    studentNumber: "402298213",
    phone: "071 554 9021",
    query: "Pay Fees",
    status: "served",
    submittedAt: "2026-09-04T08:11:00"
  },
  {
    ticketNumber: "A-020",
    name: "Aaliyah Pillay",
    studentNumber: "402355761",
    phone: "064 887 2310",
    query: "Registration",
    status: "served",
    submittedAt: "2026-09-04T08:19:00"
  },
  {
    ticketNumber: "A-021",
    name: "Lwazi Dube",
    studentNumber: "402410045",
    phone: "078 220 1188",
    query: "Access Card",
    status: "in-progress",
    submittedAt: "2026-09-04T08:27:00"
  },
  {
    ticketNumber: "A-022",
    name: "Emma van Wyk",
    studentNumber: "402387712",
    phone: "083 442 6675",
    query: "Other",
    status: "waiting",
    submittedAt: "2026-09-04T08:31:00"
  },
  {
    ticketNumber: "A-023",
    name: "Sipho Mahlangu",
    studentNumber: "402399981",
    phone: "072 018 4432",
    query: "Pay Fees",
    status: "waiting",
    submittedAt: "2026-09-04T08:34:00"
  },
  {
    ticketNumber: "A-024",
    name: "Hanan Ramanna",
    studentNumber: "402412389",
    phone: "082 123 4567",
    query: "Access Card",
    status: "waiting",
    submittedAt: "2026-09-04T08:38:00"
  },
  {
    ticketNumber: "A-025",
    name: "Zinhle Khumalo",
    studentNumber: "402376520",
    phone: "061 998 3345",
    query: "Registration",
    status: "waiting",
    submittedAt: "2026-09-04T08:41:00"
  },
  {
    ticketNumber: "A-026",
    name: "Michael Botha",
    studentNumber: "402344120",
    phone: "079 665 1120",
    query: "Pay Fees",
    status: "waiting",
    submittedAt: "2026-09-04T08:44:00"
  },
  {
    ticketNumber: "A-027",
    name: "Naledi Mokoena",
    studentNumber: "402390087",
    phone: "084 210 7789",
    query: "Other",
    status: "waiting",
    submittedAt: "2026-09-04T08:47:00"
  }
];

/* Small helper so pages can pretend they "loaded" data from a backend */
function getTickets() {
  return dummyTickets;
}
