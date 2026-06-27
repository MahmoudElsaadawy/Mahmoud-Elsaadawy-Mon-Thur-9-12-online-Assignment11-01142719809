import mongoose from "mongoose"

export const connectDB = async()=> {
  try {
    await mongoose.connect(process.env.DB_URI, {
      dbName: "Assignment11"
    })
    console.log("Connected to DB successfully", mongoose.connection.host)
  } catch (e){
    console.log("can not connect to db: " + e)
  }
}