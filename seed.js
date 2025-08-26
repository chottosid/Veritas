import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { Citizen, Police, Judge, Lawyer } from "./models/index.js";
import { connectDB } from "./config/database.js";
import dotenv from "dotenv";

dotenv.config();

const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    console.log("Clearing existing data...");
    await Citizen.deleteMany({});
    await Police.deleteMany({});
    await Judge.deleteMany({});
    await Lawyer.deleteMany({});

    const hashedPassword = await hashPassword("Password@123");

    // Dhaka Metropolitan Police Stations with OCs and Officers
    const policeData = [
      // Ramna Police Station
      {
        name: "Md. Aminul Islam",
        address: "Ramna Police Station, Dhaka-1000",
        dateOfBirth: new Date("1975-03-15"),
        phone: "+8801711111001",
        email: "aminul.ramna@dmp.gov.bd",
        pid: "DMP-001",
        rank: "Inspector",
        station: "Ramna Police Station",
        isOC: true,
        password: hashedPassword,
      },
      
      {
        name: "Md. Karim Uddin",
        address: "Ramna Police Station, Dhaka-1000",
        dateOfBirth: new Date("1980-08-22"),
        phone: "+8801711111002",
        email: "karim.ramna@dmp.gov.bd",
        pid: "DMP-002",
        rank: "Sub Inspector",
        station: "Ramna Police Station",
        isOC: false,
        password: hashedPassword,
      },
      {
        name: "Md. Rafiqul Alam",
        address: "Ramna Police Station, Dhaka-1000",
        dateOfBirth: new Date("1985-12-10"),
        phone: "+8801711111003",
        email: "rafiq.ramna@dmp.gov.bd",
        pid: "DMP-003",
        rank: "Assistant Sub Inspector",
        station: "Ramna Police Station",
        isOC: false,
        password: hashedPassword,
      },

      // Dhanmondi Police Station
      {
        name: "Md. Shahidul Haque",
        address: "Dhanmondi Police Station, Road-27, Dhaka-1209",
        dateOfBirth: new Date("1973-06-18"),
        phone: "+8801711111004",
        email: "shahid.dhanmondi@dmp.gov.bd",
        pid: "DMP-004",
        rank: "Inspector",
        station: "Dhanmondi Police Station",
        isOC: true,
        password: hashedPassword,
      },
      {
        name: "Md. Nasir Ahmed",
        address: "Dhanmondi Police Station, Road-27, Dhaka-1209",
        dateOfBirth: new Date("1982-02-14"),
        phone: "+8801711111005",
        email: "nasir.dhanmondi@dmp.gov.bd",
        pid: "DMP-005",
        rank: "Sub Inspector",
        station: "Dhanmondi Police Station",
        isOC: false,
        password: hashedPassword,
      },

      // Wari Police Station
      {
        name: "Md. Golam Mostafa",
        address: "Wari Police Station, Wari, Dhaka-1203",
        dateOfBirth: new Date("1978-11-05"),
        phone: "+8801711111006",
        email: "mostafa.wari@dmp.gov.bd",
        pid: "DMP-006",
        rank: "Inspector",
        station: "Wari Police Station",
        isOC: true,
        password: hashedPassword,
      },
      {
        name: "Md. Abul Kalam",
        address: "Wari Police Station, Wari, Dhaka-1203",
        dateOfBirth: new Date("1983-07-30"),
        phone: "+8801711111007",
        email: "kalam.wari@dmp.gov.bd",
        pid: "DMP-007",
        rank: "Sub Inspector",
        station: "Wari Police Station",
        isOC: false,
        password: hashedPassword,
      },

      // Tejgaon Police Station
      {
        name: "Md. Monirul Islam",
        address: "Tejgaon Police Station, Tejgaon, Dhaka-1208",
        dateOfBirth: new Date("1976-09-12"),
        phone: "+8801711111008",
        email: "monir.tejgaon@dmp.gov.bd",
        pid: "DMP-008",
        rank: "Inspector",
        station: "Tejgaon Police Station",
        isOC: true,
        password: hashedPassword,
      },
      {
        name: "Md. Faruk Hossain",
        address: "Tejgaon Police Station, Tejgaon, Dhaka-1208",
        dateOfBirth: new Date("1984-04-25"),
        phone: "+8801711111009",
        email: "faruk.tejgaon@dmp.gov.bd",
        pid: "DMP-009",
        rank: "Sub Inspector",
        station: "Tejgaon Police Station",
        isOC: false,
        password: hashedPassword,
      },

      // Paltan Police Station
      {
        name: "Md. Shamsul Huda",
        address: "Paltan Police Station, Paltan, Dhaka-1000",
        dateOfBirth: new Date("1974-01-20"),
        phone: "+8801711111010",
        email: "shamsul.paltan@dmp.gov.bd",
        pid: "DMP-010",
        rank: "Inspector",
        station: "Paltan Police Station",
        isOC: true,
        password: hashedPassword,
      },
      {
        name: "Md. Jalal Uddin",
        address: "Paltan Police Station, Paltan, Dhaka-1000",
        dateOfBirth: new Date("1981-10-08"),
        phone: "+8801711111011",
        email: "jalal.paltan@dmp.gov.bd",
        pid: "DMP-011",
        rank: "Sub Inspector",
        station: "Paltan Police Station",
        isOC: false,
        password: hashedPassword,
      },

      // Uttara Police Station
      {
        name: "Md. Abdul Mannan",
        address: "Uttara Police Station, Sector-7, Uttara, Dhaka-1230",
        dateOfBirth: new Date("1977-05-14"),
        phone: "+8801711111012",
        email: "mannan.uttara@dmp.gov.bd",
        pid: "DMP-012",
        rank: "Inspector",
        station: "Uttara Police Station",
        isOC: true,
        password: hashedPassword,
      },
      {
        name: "Md. Hafizur Rahman",
        address: "Uttara Police Station, Sector-7, Uttara, Dhaka-1230",
        dateOfBirth: new Date("1986-03-28"),
        phone: "+8801711111013",
        email: "hafiz.uttara@dmp.gov.bd",
        pid: "DMP-013",
        rank: "Sub Inspector",
        station: "Uttara Police Station",
        isOC: false,
        password: hashedPassword,
      },
    ];

    // Judge Data
    const judgeData = [
      {
        name: "Justice Md. Abdur Rahman",
        address: "Judge Court, Dhaka, Bangladesh",
        dateOfBirth: new Date("1965-08-15"),
        phone: "+8801711112001",
        email: "justice.rahman@court.gov.bd",
        courtName: "Dhaka Metropolitan Sessions Judge Court",
        rank: "Sessions Judge",
        jid: "DJ-001",
        password: hashedPassword,
      },
      {
        name: "Justice Mrs. Rashida Begum",
        address: "Additional Judge Court, Dhaka, Bangladesh",
        dateOfBirth: new Date("1968-12-03"),
        phone: "+8801711112002",
        email: "justice.rashida@court.gov.bd",
        courtName: "Dhaka Additional Metropolitan Sessions Judge Court",
        rank: "Additional Sessions Judge",
        jid: "DJ-002",
        password: hashedPassword,
      },
      {
        name: "Justice Md. Nurul Hasan",
        address: "Chief Judicial Magistrate Court, Dhaka, Bangladesh",
        dateOfBirth: new Date("1970-04-22"),
        phone: "+8801711112003",
        email: "justice.nurul@court.gov.bd",
        courtName: "Chief Judicial Magistrate Court, Dhaka",
        rank: "Chief Judicial Magistrate",
        jid: "DJ-003",
        password: hashedPassword,
      },
    ];

    // Lawyer Data
    const lawyerData = [
      {
        name: "Advocate Md. Kamal Hossain",
        address: "Supreme Court Bar Association, Dhaka",
        dateOfBirth: new Date("1972-06-10"),
        phone: "+8801711113001",
        email: "kamal.advocate@lawfirm.com",
        firmName: "Kamal & Associates Law Firm",
        bid: "SCBA-001",
        password: hashedPassword,
      },
      {
        name: "Advocate Mrs. Fatema Khatun",
        address: "Dhaka Bar Association, High Court, Dhaka",
        dateOfBirth: new Date("1975-09-25"),
        phone: "+8801711113002",
        email: "fatema.advocate@lawchamber.com",
        firmName: "Fatema Law Chamber",
        bid: "DBA-002",
        password: hashedPassword,
      },
      {
        name: "Advocate Md. Ruhul Amin",
        address: "District Bar Association, Dhaka",
        dateOfBirth: new Date("1978-01-18"),
        phone: "+8801711113003",
        email: "ruhul.advocate@legal.com",
        firmName: "Amin Legal Associates",
        bid: "DBA-003",
        password: hashedPassword,
      },
      {
        name: "Advocate Md. Shahjalal Islam",
        address: "Supreme Court Bar Association, Dhaka",
        dateOfBirth: new Date("1980-11-12"),
        phone: "+8801711113004",
        email: "shahjalal.advocate@justicelaw.com",
        firmName: "Justice Law Firm",
        bid: "SCBA-004",
        password: hashedPassword,
      },
    ];

    // Citizen Data
    const citizenData = [
      {
        name: "Md. Rahim Uddin",
        address: "House-25, Road-8, Dhanmondi, Dhaka-1205",
        dateOfBirth: new Date("1985-03-12"),
        phone: "+8801711114001",
        email: "rahim.citizen@gmail.com",
        nid: "1234567890123",
        password: hashedPassword,
      },
      {
        name: "Mrs. Salma Khatun",
        address: "Flat-4B, Building-12, Uttara Sector-4, Dhaka-1230",
        dateOfBirth: new Date("1988-07-20"),
        phone: "+8801711114002",
        email: "salma.citizen@gmail.com",
        nid: "2345678901234",
        password: hashedPassword,
      },
      {
        name: "Md. Nasir Ahmed",
        address: "House-45, Lane-3, Wari, Dhaka-1203",
        dateOfBirth: new Date("1982-11-08"),
        phone: "+8801711114003",
        email: "nasir.citizen@gmail.com",
        nid: "3456789012345",
        password: hashedPassword,
      },
      {
        name: "Mrs. Rashida Begum",
        address: "Apartment-7A, Green Road, Dhaka-1205",
        dateOfBirth: new Date("1990-05-15"),
        phone: "+8801711114004",
        email: "rashida.citizen@gmail.com",
        nid: "4567890123456",
        password: hashedPassword,
      },
    ];

    // Insert data
    console.log("Inserting police data...");
    const policeInserted = await Police.insertMany(policeData);
    console.log(`Inserted ${policeInserted.length} police officers`);

    console.log("Inserting judge data...");
    const judgesInserted = await Judge.insertMany(judgeData);
    console.log(`Inserted ${judgesInserted.length} judges`);

    console.log("Inserting lawyer data...");
    const lawyersInserted = await Lawyer.insertMany(lawyerData);
    console.log(`Inserted ${lawyersInserted.length} lawyers`);

    console.log("Inserting citizen data...");
    const citizensInserted = await Citizen.insertMany(citizenData);
    console.log(`Inserted ${citizensInserted.length} citizens`);

    console.log("\n=== Database Seeding Complete ===");
    console.log(`Total records inserted:`);
    console.log(
      `- Police Officers: ${policeInserted.length} (Including ${
        policeData.filter((p) => p.isOC).length
      } OCs)`
    );
    console.log(`- Judges: ${judgesInserted.length}`);
    console.log(`- Lawyers: ${lawyersInserted.length}`);
    console.log(`- Citizens: ${citizensInserted.length}`);
    console.log(`\nDefault password for all accounts: Password@123`);

    console.log("\n=== Police Stations Coverage ===");
    const stations = [...new Set(policeData.map((p) => p.station))];
    stations.forEach((station) => {
      const officers = policeData.filter((p) => p.station === station);
      const oc = officers.find((o) => o.isOC);
      console.log(`${station}: OC - ${oc.name} (${oc.rank})`);
    });

    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedData();
