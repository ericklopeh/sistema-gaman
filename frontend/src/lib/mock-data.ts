import type {
  AIQueryResponse,
  DashboardSummary,
  Pedido,
  Refinanciamiento,
  Saldo,
  Talon,
} from "./types";

export const MOCK_TALONES: Talon[] = [
  {
    id: 1,
    folio: "REV-2026-0142",
    cliente: "Muebles del Norte SA de CV",
    rfc: "MNO850312AB1",
    seccion: "21",
    vendedor: "Carlos Mendoza",
    descuento_actual: 12.0,
    descuento_nuevo: 18.5,
    venta_posible: 245_800.0,
    estado: "pendiente",
  },
  {
    id: 2,
    folio: "REV-2026-0143",
    cliente: "Decoraciones Modernas",
    rfc: "DMO870622IJ5",
    seccion: "14",
    vendedor: "Ana Torres",
    descuento_actual: 10.0,
    descuento_nuevo: 15.0,
    venta_posible: 89_450.0,
    estado: "autorizado",
  },
  {
    id: 3,
    folio: "REV-2026-0144",
    cliente: "Grupo Muebles Express",
    rfc: "GME950408GH4",
    seccion: "08",
    vendedor: "Patricia Gómez",
    descuento_actual: 8.0,
    descuento_nuevo: 14.0,
    venta_posible: 156_200.0,
    estado: "en_revision",
  },
  {
    id: 4,
    folio: "REV-2026-0145",
    cliente: "Comercializadora Rivera",
    rfc: "CRV880201EF3",
    seccion: "21",
    vendedor: "Luis Rivera",
    descuento_actual: 15.0,
    descuento_nuevo: 20.0,
    venta_posible: 312_750.0,
    estado: "pendiente",
  },
];

export const MOCK_PEDIDOS: Pedido[] = [
  {
    id: 1,
    folio: "PED-2026-0087",
    cliente: "Distribuidora Hogar Plus",
    tipo_venta: "contado",
    vendedor: "Ana Torres",
    documentos: ["orden_compra", "identificacion"],
    estado: "en_compulsa",
  },
  {
    id: 2,
    folio: "PED-2026-0088",
    cliente: "Muebles del Norte SA de CV",
    tipo_venta: "credito",
    vendedor: "Carlos Mendoza",
    documentos: ["orden_compra"],
    estado: "pendiente_documentos",
  },
  {
    id: 3,
    folio: "PED-2026-0089",
    cliente: "Grupo Muebles Express",
    tipo_venta: "contado",
    vendedor: "Patricia Gómez",
    documentos: ["orden_compra", "identificacion", "comprobante_domicilio"],
    estado: "autorizado",
  },
  {
    id: 4,
    folio: "PED-2026-0090",
    cliente: "Decoraciones Modernas",
    tipo_venta: "credito",
    vendedor: "Ana Torres",
    documentos: ["orden_compra", "identificacion"],
    estado: "en_compulsa",
  },
  {
    id: 5,
    folio: "PED-2026-0091",
    cliente: "Comercializadora Rivera",
    tipo_venta: "contado",
    vendedor: "Luis Rivera",
    documentos: ["orden_compra", "identificacion", "referencias"],
    estado: "entregado",
  },
];

export const MOCK_REFINANCIAMIENTOS: Refinanciamiento[] = [
  {
    id: 1,
    cliente: "Comercializadora Rivera",
    venta_original: "VTA-2024-1892",
    saldo: 48_500.0,
    pagado: 32_100.0,
    porcentaje_pagado: 66.2,
    elegible: true,
    estado: "en_revision",
  },
  {
    id: 2,
    cliente: "Distribuidora Hogar Plus",
    venta_original: "VTA-2023-1456",
    saldo: 22_800.0,
    pagado: 22_800.0,
    porcentaje_pagado: 100.0,
    elegible: true,
    estado: "aprobado",
  },
  {
    id: 3,
    cliente: "Muebles del Norte SA de CV",
    venta_original: "VTA-2025-0312",
    saldo: 95_200.0,
    pagado: 28_560.0,
    porcentaje_pagado: 30.0,
    elegible: false,
    estado: "no_elegible",
  },
  {
    id: 4,
    cliente: "Grupo Muebles Express",
    venta_original: "VTA-2024-2103",
    saldo: 15_400.0,
    pagado: 12_320.0,
    porcentaje_pagado: 80.0,
    elegible: true,
    estado: "pendiente",
  },
];

export const MOCK_SALDOS: Saldo[] = [
  {
    id: 1,
    factura: "FAC-2026-4521",
    cliente: "Grupo Muebles Express",
    saldo_sistema: 18_750.0,
    saldo_calculado: 19_125.0,
    diferencia: 375.0,
    estado: "diferencia_detectada",
  },
  {
    id: 2,
    factura: "FAC-2026-4518",
    cliente: "Muebles del Norte SA de CV",
    saldo_sistema: 42_300.0,
    saldo_calculado: 42_300.0,
    diferencia: 0.0,
    estado: "conciliado",
  },
  {
    id: 3,
    factura: "FAC-2026-4509",
    cliente: "Distribuidora Hogar Plus",
    saldo_sistema: 8_920.0,
    saldo_calculado: 9_180.0,
    diferencia: 260.0,
    estado: "diferencia_detectada",
  },
  {
    id: 4,
    factura: "FAC-2026-4495",
    cliente: "Comercializadora Rivera",
    saldo_sistema: 31_500.0,
    saldo_calculado: 31_500.0,
    diferencia: 0.0,
    estado: "conciliado",
  },
  {
    id: 5,
    factura: "FAC-2026-4487",
    cliente: "Decoraciones Modernas",
    saldo_sistema: 5_640.0,
    saldo_calculado: 5_890.0,
    diferencia: 250.0,
    estado: "en_revision",
  },
];

const MOCK_CASES_ESTADOS = [
  "pendiente",
  "en_compulsa",
  "en_revision",
  "diferencia_detectada",
  "autorizado",
  "pendiente_documentos",
  "aprobado",
  "conciliado",
];

export const MOCK_DASHBOARD_SUMMARY: DashboardSummary = {
  talones_pendientes: MOCK_TALONES.filter((t) =>
    ["pendiente", "en_revision"].includes(t.estado),
  ).length,
  pedidos_activos: MOCK_PEDIDOS.filter(
    (p) => !["entregado", "cancelado"].includes(p.estado),
  ).length,
  refinanciamientos: MOCK_REFINANCIAMIENTOS.filter((r) => r.estado !== "aprobado")
    .length,
  diferencias_saldos: MOCK_SALDOS.filter((s) => s.diferencia !== 0).length,
  pedidos_pendientes_revision: 1,
  autorizaciones_generadas: 0,
  sindicatos_generados: 0,
  pendientes_compulsa: 0,
  compulsados: 0,
  pendientes_compra: 0,
  comprados_hoy: 0,
  ventas_por_vendedor: {},
  casos_por_estado: MOCK_CASES_ESTADOS.reduce<Record<string, number>>(
    (acc, estado) => {
      acc[estado] = (acc[estado] ?? 0) + 1;
      return acc;
    },
    {},
  ),
  actividad_reciente: [
    {
      id: 1,
      tipo: "revision",
      descripcion: "Nuevo talón REV-2026-0142 registrado para revisión",
      usuario: "Carlos Mendoza",
      timestamp: "2026-06-18T08:30:00",
    },
    {
      id: 2,
      tipo: "pedido",
      descripcion: "Pedido PED-2026-0087 enviado a compulsa",
      usuario: "Ana Torres",
      timestamp: "2026-06-18T06:30:00",
    },
    {
      id: 3,
      tipo: "autorizacion",
      descripcion: "Descuento autorizado en REV-2026-0143",
      usuario: "Gerencia",
      timestamp: "2026-06-18T04:30:00",
    },
    {
      id: 4,
      tipo: "saldo",
      descripcion: "Diferencia detectada en FAC-2026-4521",
      usuario: "Sistema",
      timestamp: "2026-06-18T02:30:00",
    },
    {
      id: 5,
      tipo: "refinanciamiento",
      descripcion: "Solicitud REF-2026-0031 en revisión",
      usuario: "Luis Rivera",
      timestamp: "2026-06-17T10:30:00",
    },
  ],
  documentos_recientes: [
    {
      id: 1,
      nombre: "Orden de compra PED-2026-0087.pdf",
      tipo: "orden_compra",
      cliente: "Distribuidora Hogar Plus",
      folio: "PED-2026-0087",
      uploaded_at: "2026-06-18T07:30:00",
    },
    {
      id: 2,
      nombre: "Identificación MNO850312AB1.pdf",
      tipo: "identificacion",
      cliente: "Muebles del Norte SA de CV",
      folio: "PED-2026-0088",
      uploaded_at: "2026-06-18T05:30:00",
    },
    {
      id: 3,
      nombre: "Talón REV-2026-0142.xlsx",
      tipo: "talon",
      cliente: "Muebles del Norte SA de CV",
      folio: "REV-2026-0142",
      uploaded_at: "2026-06-18T08:30:00",
    },
    {
      id: 4,
      nombre: "Estado de cuenta CRV880201EF3.pdf",
      tipo: "estado_cuenta",
      cliente: "Comercializadora Rivera",
      folio: "REF-2026-0031",
      uploaded_at: "2026-06-17T10:30:00",
    },
  ],
};

export function getMockAIResponse(question: string): AIQueryResponse {
  const q = question.toLowerCase();

  if (q.includes("compulsa") || q.includes("pedido")) {
    return {
      answer:
        "Se encontraron 3 pedidos pendientes de compulsa. Los casos más antiguos pertenecen a la sección 21.",
      sources: ["Historial de pedidos", "Documentos cargados", "Estados operativos"],
    };
  }

  if (q.includes("talon") || q.includes("talón") || q.includes("descuento")) {
    return {
      answer:
        "Hay 2 talones pendientes de autorización y 1 en revisión. El de mayor venta posible es REV-2026-0145 por $312,750.",
      sources: ["Revisiones de talones", "Historial de autorizaciones"],
    };
  }

  if (q.includes("saldo") || q.includes("diferencia") || q.includes("factura")) {
    return {
      answer:
        "Se detectaron 2 facturas con diferencias de saldo por un total de $635. La más reciente es FAC-2026-4521.",
      sources: ["Conciliación de saldos", "Facturas del sistema"],
    };
  }

  if (q.includes("juan") || q.includes("pérez") || q.includes("perez")) {
    return {
      answer:
        "No se encontró un caso activo para Juan Pérez en los datos demo. Los clientes con actividad reciente son Muebles del Norte, Distribuidora Hogar Plus y Comercializadora Rivera.",
      sources: ["Casos consolidados", "Historial de clientes"],
    };
  }

  if (q.includes("documento") || q.includes("falta")) {
    return {
      answer:
        "Para PED-2026-0088 faltan: identificación, comprobante de domicilio y referencias. El pedido está en estado pendiente de documentos.",
      sources: ["Documentos cargados", "Checklist de compulsa"],
    };
  }

  return {
    answer:
      "Con la información demo disponible, hay 8 casos activos distribuidos entre revisiones, pedidos, refinanciamientos y saldos. ¿Deseas detalle de algún módulo en particular?",
    sources: ["Dashboard operativo", "Casos consolidados", "Estados operativos"],
  };
}