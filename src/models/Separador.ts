import mongoose, { Schema, Document, Model } from "mongoose";

// Un "Separador" representa una unidad o división de la Wiki (ej. Unidad 1, Unidad 2...)
// con opciones de personalización visual (imagen, color de texto, fondo, acento, fuente).
export interface ISeparador extends Document {
  title: string;
  description: string;
  order: number;
  imageUrl: string;
  textColor: string;
  bgColor: string;
  accentColor: string;
  fontFamily: string;
  fontSize: string;
  createdAt: Date;
  updatedAt: Date;
}

const SeparadorSchema: Schema<ISeparador> = new Schema(
  {
    title: {
      type: String,
      required: [true, "El título del separador es obligatorio"],
      trim: true,
      maxlength: [150, "El título no puede exceder 150 caracteres"],
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: [500, "La descripción no puede exceder 500 caracteres"],
    },
    order: {
      type: Number,
      required: true,
      default: 1,
      min: [1, "El orden debe ser al menos 1"],
    },
    imageUrl: {
      type: String,
      default: "",
      trim: true,
    },
    textColor: {
      type: String,
      default: "#e2e8f0",
      trim: true,
    },
    bgColor: {
      type: String,
      default: "#0f172a",
      trim: true,
    },
    accentColor: {
      type: String,
      default: "#10b981",
      trim: true,
    },
    fontFamily: {
      type: String,
      default: "sans",
      trim: true,
    },
    fontSize: {
      type: String,
      default: "base",
      trim: true,
    },
  },
  { timestamps: true }
);

if (mongoose.models.Separador) {
  delete mongoose.models.Separador;
}

const Separador: Model<ISeparador> = mongoose.model<ISeparador>(
  "Separador",
  SeparadorSchema
);

export default Separador;
