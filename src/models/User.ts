import mongoose, { Schema } from "mongoose";

export interface UserDocument extends mongoose.Document {
  email: string;
  passwordHash: string;
  createdAt: Date;
}

const UserSchema = new Schema<UserDocument>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    createdAt: { type: Date, default: () => new Date() }
  },
  { versionKey: false }
);

export const UserModel = mongoose.model<UserDocument>("User", UserSchema);
