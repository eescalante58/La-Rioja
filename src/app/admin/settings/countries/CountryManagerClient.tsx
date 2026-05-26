"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Card,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Text,
  Title,
  Button,
  TextInput,
  Dialog,
  DialogPanel,
} from "@tremor/react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  ArrowLeft,
  XCircle,
  Download,
  Upload,
  FileJson,
  FileSpreadsheet,
} from "lucide-react";
import Link from "next/link";
import {
  saveCountryCode,
  deleteCountryCode,
  importCountryCodes,
  logExportActivity,
} from "./actions";

interface CountryCode {
  id: number;
  iso2: string;
  iso3: string;
  name: string;
  phone_code: string;
  flag_emoji: string | null;
}

/**
 * Helper to convert ISO2 to Flag Emoji
 */
const getFlagEmoji = (iso2: string) => {
  if (!iso2 || iso2.length !== 2) return "🌐";
  const codePoints = iso2
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

/**
 * Client component for managing country codes.
 * @param {Object} props - Component props.
 * @param {CountryCode[]} props.initialData - Initial list of country codes.
 */
export default function CountryManagerClient({
  initialData,
}: {
  initialData: CountryCode[];
}) {
  const [countries, setCountries] = useState(initialData);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCountry, setEditingCountry] = useState<CountryCode | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  // Sync state if initialData changes
  useEffect(() => {
    if (initialData) {
      setCountries(initialData);
    }
  }, [initialData]);

  const filteredCountries = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();
    if (!search) {
      return [...countries].sort((a, b) => a.name.localeCompare(b.name));
    }

    return countries
      .filter((c) => {
        const name = (c.name || "").toLowerCase();
        const phone = (c.phone_code || "").toLowerCase();
        const iso2 = (c.iso2 || "").toLowerCase();
        const iso3 = (c.iso3 || "").toLowerCase();

        return (
          name.includes(search) ||
          phone.includes(search) ||
          iso2.includes(search) ||
          iso3.includes(search)
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [searchTerm, countries]);

  const handleOpenDialog = (country: CountryCode | null = null) => {
    setEditingCountry(country);
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await saveCountryCode(formData);

    if (result.success) {
      window.location.reload();
    } else {
      alert("Error: " + result.error);
      setLoading(false);
    }
  };

  const handleDownloadJSON = async () => {
    const dataStr = JSON.stringify(countries, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = "country_codes.json";
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();

    // Log the export activity
    await logExportActivity(countries.length);
  };

  const handleDownloadCSV = async () => {
    const headers = ["iso2", "iso3", "name", "phone_code", "flag_emoji"];
    const rows = countries.map((c) => [
      c.iso2,
      c.iso3,
      c.name,
      c.phone_code,
      c.flag_emoji || "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "country_codes.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Log the export activity
    await logExportActivity(countries.length);
  };

  const processImport = async (json: any[]) => {
    setLoading(true);
    try {
      const result = await importCountryCodes(json);
      if (result.success) {
        alert("Importación exitosa");
        window.location.reload();
      } else {
        alert("Error en la importación: " + result.error);
      }
    } catch (err) {
      alert("Error al procesar la importación: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    const isCsv = file.name.endsWith(".csv");

    reader.onload = async (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        let content = "";

        // Try UTF-8 first
        const utf8Decoder = new TextDecoder("utf-8", { fatal: true });
        try {
          content = utf8Decoder.decode(buffer);
        } catch (e) {
          // Fallback to ISO-8859-1
          const latinDecoder = new TextDecoder("iso-8859-1");
          content = latinDecoder.decode(buffer);
        }

        let data: any[] = [];

        if (isCsv) {
          const lines = content.split("\n");
          const headers = lines[0].split(",").map((h) => h.trim());
          data = lines
            .slice(1)
            .filter((line) => line.trim())
            .map((line) => {
              const values = line.split(",");
              const obj: any = {};
              headers.forEach((header, index) => {
                obj[header] = values[index]?.trim();
              });
              return obj;
            });
        } else {
          data = JSON.parse(content);
          if (!Array.isArray(data))
            throw new Error("El archivo JSON debe ser un array");
        }

        await processImport(data);
      } catch (err) {
        alert("Error al procesar el archivo: " + (err as Error).message);
      }
    };
    reader.readAsArrayBuffer(file);
    // Reset input
    e.target.value = "";
  };

  const handleDelete = async (id: number) => {
    if (confirm("¿Estás seguro de eliminar este país?")) {
      const result = await deleteCountryCode(id);
      if (result.success) {
        window.location.reload();
      } else {
        alert("Error: " + result.error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-gray-100 dark:border-gray-800 pb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/settings">
            <Button variant="light" icon={ArrowLeft} className="rounded-full" />
          </Link>
          <div>
            <Title className="text-2xl font-black text-larioja-azul dark:text-white uppercase tracking-tight">
              Códigos de Países
            </Title>
            <Text className="text-sm mt-1 text-gray-500 dark:text-gray-400">
              Administra los prefijos telefónicos globales para envíos de
              WhatsApp.
            </Text>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
            <Button
              variant="light"
              icon={FileJson}
              onClick={handleDownloadJSON}
              size="xs"
              tooltip="Exportar JSON"
            >
              JSON
            </Button>
            <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />
            <Button
              variant="light"
              icon={FileSpreadsheet}
              onClick={handleDownloadCSV}
              size="xs"
              tooltip="Exportar CSV"
            >
              CSV
            </Button>
          </div>

          <div className="relative">
            <input
              type="file"
              accept=".json,.csv"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              title="Importar JSON o CSV"
            />
            <Button variant="secondary" icon={Upload}>
              Importar
            </Button>
          </div>
          <Button
            icon={Plus}
            onClick={() => handleOpenDialog()}
            className="bg-larioja-azul hover:bg-blue-800"
          >
            Añadir País
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
          <Search className="text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nombre, prefijo o ISO..."
            className="bg-transparent border-none outline-none text-sm flex-1 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                setSearchTerm("");
              }
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <XCircle size={18} />
            </button>
          )}
        </div>

        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Bandera</TableHeaderCell>
              <TableHeaderCell>Nombre</TableHeaderCell>
              <TableHeaderCell>ISO2</TableHeaderCell>
              <TableHeaderCell>ISO3</TableHeaderCell>
              <TableHeaderCell>Prefijo</TableHeaderCell>
              <TableHeaderCell className="text-right">Acciones</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country) => (
                <TableRow key={country.id}>
                  <TableCell>
                    <img
                      src={`https://flagcdn.com/w40/${country.iso2.toLowerCase()}.png`}
                      width="32"
                      alt={country.name}
                      className="rounded shadow-sm border border-gray-100 dark:border-gray-800"
                    />
                  </TableCell>
                  <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                    {country.name}
                  </TableCell>
                  <TableCell>{country.iso2}</TableCell>
                  <TableCell>{country.iso3}</TableCell>
                  <TableCell>
                    <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded text-xs font-bold">
                      {country.phone_code.startsWith("+")
                        ? country.phone_code
                        : `+${country.phone_code}`}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="light"
                        icon={Edit}
                        size="xs"
                        onClick={() => handleOpenDialog(country)}
                      />
                      <Button
                        variant="light"
                        icon={Trash2}
                        size="xs"
                        color="rose"
                        onClick={() => handleDelete(country.id)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <Search size={40} strokeWidth={1} />
                    <Text className="text-lg font-medium">
                      País NO ENCONTRADO
                    </Text>
                    <Text className="text-sm">
                      Intenta con otro nombre, prefijo o código ISO.
                    </Text>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        static={true}
      >
        <div className="fixed inset-0 bg-gray-500/30 dark:bg-black/50 backdrop-blur-sm z-50" />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <DialogPanel className="max-w-md w-full bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 transition-all duration-300">
            <Title className="mb-4 text-larioja-azul dark:text-larioja-amarillo">
              {editingCountry ? "Editar País" : "Nuevo País"}
            </Title>
            <form onSubmit={handleSave} className="space-y-4">
              {editingCountry && (
                <input type="hidden" name="id" value={editingCountry.id} />
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Text className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">
                    ISO 2
                  </Text>
                  <TextInput
                    name="iso2"
                    placeholder="Ej: SV"
                    defaultValue={editingCountry?.iso2 || ""}
                    maxLength={2}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Text className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">
                    ISO 3
                  </Text>
                  <TextInput
                    name="iso3"
                    placeholder="Ej: SLV"
                    defaultValue={editingCountry?.iso3 || ""}
                    maxLength={3}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Text className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">
                  Nombre del País
                </Text>
                <TextInput
                  name="name"
                  placeholder="Ej: El Salvador"
                  defaultValue={editingCountry?.name || ""}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Text className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">
                    Código Telefónico
                  </Text>
                  <TextInput
                    name="phone_code"
                    placeholder="Ej: 503"
                    defaultValue={editingCountry?.phone_code || ""}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Text className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">
                    Emoji Bandera
                  </Text>
                  <TextInput
                    name="flag_emoji"
                    placeholder="🇦🇷"
                    defaultValue={editingCountry?.flag_emoji || ""}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="secondary"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={loading}
                  type="button"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  loading={loading}
                  className="bg-larioja-azul hover:bg-blue-800 text-white"
                >
                  Guardar
                </Button>
              </div>
            </form>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}
