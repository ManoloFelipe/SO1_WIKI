import mongoose, { Schema, Document, Model } from "mongoose";

// Un tema teórico de la Wiki (solo texto), organizado por unidad.
export interface ITema extends Document {
  title: string;
  unit: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const TemaSchema: Schema<ITema> = new Schema(
  {
    title: {
      type: String,
      required: [true, "El título es obligatorio"],
      trim: true,
      maxlength: [150, "El título no puede exceder 150 caracteres"],
    },
    unit: {
      type: Number,
      required: [true, "La unidad es obligatoria"],
      min: [1, "La unidad debe ser de 1 a 3"],
      max: [3, "La unidad debe ser de 1 a 3"],
    },
    content: {
      type: String,
      required: [true, "El contenido es obligatorio"],
      trim: true,
    },
  },
  { timestamps: true }
);

const Tema: Model<ITema> =
  mongoose.models.Tema || mongoose.model<ITema>("Tema", TemaSchema);

export default Tema;
