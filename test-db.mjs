import { PrismaClient } from "@prisma/client"
const p = new PrismaClient()
try {
  const u = await p.user.create({
    data: {
      name: "test",
      email: "test@test.com",
      password: "test12345",
      college: "Engineering",
      department: "Software Engineering",
      year: "Year 2",
      semester: "Semester 1",
    },
  })
  console.log("SUCCESS:", u)
} catch (e) {
  console.error("ERROR:", e.message)
} finally {
  await p.$disconnect()
}
