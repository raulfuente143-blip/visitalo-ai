"use client";

import { deleteProperty } from "@/app/actions/properties";

export function DeletePropertyButton({ propertyId }: { propertyId: string }) {
  const handleDelete = async () => {
    if (!window.confirm("¿Eliminar esta propiedad?")) {
      return;
    }

    await deleteProperty(propertyId);
  };

  return (
    <button
      type="button"
      onClick={() => {
        void handleDelete();
      }}
      className="inline-flex rounded-full border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 transition-all duration-200 hover:bg-red-50"
    >
      Eliminar
    </button>
  );
}
