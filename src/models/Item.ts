import mongoose, { Schema, Document, Model } from "mongoose";

export interface IItem extends Document {
  title: string;
  content: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

const ItemSchema: Schema<IItem> = new Schema(
  {
    title: {
      type: String,
      required: [true, "El título es obligatorio"],
      trim: true,
      maxlength: [120, "El título no puede exceder 120 caracteres"],
    },
    content: {
      type: String,
      required: [true, "El contenido es obligatorio"],
      trim: true,
    },
    category: {
      type: String,
      default: "General",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Previene sobreescribir el modelo durante el re-compilado en Next.js
const Item: Model<IItem> =
  mongoose.models.Item || mongoose.model<IItem>("Item", ItemSchema);

export default Item;
