import mongoose, { Schema, Document, Model } from "mongoose";

// Un tema o contenido de la Wiki creado por el administrador dentro de un separador/unidad.
export interface ITema extends Document {
  title: string;
  unit: number;
  separadorId?: string | null;
  content: string;
  imageUrl?: string;
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
      default: 1,
      min: [1, "La unidad debe ser mayor o igual a 1"],
    },
    separadorId: {
      type: String,
      default: null,
      index: true,
    },
    content: {
      type: String,
      required: [true, "El contenido es obligatorio"],
      trim: true,
    },
    imageUrl: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

if (mongoose.models.Tema) {
  delete mongoose.models.Tema;
}

const Tema: Model<ITema> = mongoose.model<ITema>("Tema", TemaSchema);

export default Tema;
