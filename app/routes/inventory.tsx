import { useEffect, useState, type ChangeEvent } from "react";
import { Boxes, Edit, Package, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { CreateInventoryModal } from "../components/inventory/CreateInventoryModal";
import { EditInventoryModal } from "../components/inventory/EditInventoryModal";
import { useToast } from "../context/ToastContext";
import { useConfirm } from "../hooks/useConfirm";
import { useAuth } from "../context/AuthContext";
import { inventoryService } from "../services/api";
import type { InventoryRecord, InventorySummaryItem } from "../types/auth";

export default function InventoryPage() {
  const { hasPermission } = useAuth();
  const [records, setRecords] = useState<InventoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<InventoryRecord | null>(
    null,
  );
  const [summary, setSummary] = useState<InventorySummaryItem[]>([]);
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();
  const { success, error: showError } = useToast();

  useEffect(() => {
    loadRecords();
    loadSummary();
  }, [currentPage, search]);

  const loadSummary = async () => {
    try {
      const response = await inventoryService.getSummary();
      if (response.success && response.data) {
        setSummary(response.data);
      }
    } catch (error) {
      console.error("Error loading inventory summary:", error);
    }
  };

  const loadRecords = async () => {
    setLoading(true);
    try {
      const response = await inventoryService.getAll(currentPage, 10, search);
      if (response.success && response.data) {
        setRecords(response.data.data || []);
        setTotalPages(response.data.totalPages || 1);
      } else {
        showError(response.error || "Error al cargar inventario");
        setRecords([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Error loading inventory:", error);
      showError("Error al cargar inventario");
      setRecords([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record: InventoryRecord) => {
    setSelectedRecord(record);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedRecord(null);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: "Confirmar eliminacion",
      message:
        "¿Seguro que deseas eliminar este registro de inventario? Esta accion no se puede deshacer.",
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      confirmVariant: "destructive",
    });

    if (!confirmed) return;

    try {
      const response = await inventoryService.delete(id);
      if (response.success) {
        success("Registro eliminado exitosamente");
        loadRecords();
        loadSummary();
      } else {
        showError(response.error || "Error al eliminar registro");
      }
    } catch (error) {
      console.error("Error deleting inventory record:", error);
      showError("Error al eliminar registro");
    }
  };

  return (
    <ProtectedRoute requiredPermissions={["READ_PAYROLL"]}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="md:flex md:items-center md:justify-between mb-6">
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                  Inventario de Produccion
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Registros de productos producidos en planta.
                </p>
              </div>
              {hasPermission("CREATE_PAYROLL") && (
                <div className="mt-4 flex md:mt-0 md:ml-4">
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Inventario
                  </Button>
                </div>
              )}
            </div>

            {summary.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Resumen por producto
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {summary.map((item) => (
                    <div
                      key={item.productId}
                      className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <p
                          className="text-sm font-medium text-gray-900 truncate"
                          title={item.productName}
                        >
                          {item.productName}
                        </p>
                      </div>
                      <p className="text-2xl font-bold text-indigo-600">
                        {item.totalQuantity.toLocaleString()}
                        <span className="text-xs text-gray-400 font-semibold space-x-1 ml-1">
                          unidad(es)
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar por producto, codigo, lote o vencimiento..."
                  value={search}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setSearch(e.target.value)
                  }
                  className="pl-10"
                />
              </div>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 sm:p-6">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-500">Cargando registros...</p>
                  </div>
                ) : records.length === 0 ? (
                  <div className="text-center py-12">
                    <Boxes className="h-10 w-10 mx-auto text-gray-300" />
                    <p className="mt-4 text-gray-500">
                      No se encontraron registros de inventario
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-4 md:hidden">
                      {records.map((record) => (
                        <div
                          key={record.id}
                          className="border border-gray-200 rounded-lg p-4 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="text-sm font-semibold text-gray-900">
                                {record.product?.name || "Producto eliminado"}
                              </h3>
                              <p className="text-xs text-gray-500 mt-1">
                                Codigo: {record.product?.productCode || "-"}
                              </p>
                            </div>
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {record.quantity} und.
                            </span>
                          </div>

                          <div className="mt-3 space-y-1 text-sm text-gray-700">
                            <p>
                              <span className="font-medium">Lote:</span>{" "}
                              {record.lotNumber}
                            </p>
                            <p>
                              <span className="font-medium">Vence:</span>{" "}
                              {record.expirationDate}
                            </p>
                          </div>

                          <div className="mt-4 flex items-center justify-end gap-2">
                            {hasPermission("UPDATE_PAYROLL") && (
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Editar"
                                onClick={() => handleEdit(record)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {hasPermission("DELETE_PAYROLL") && (
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Eliminar"
                                onClick={() => handleDelete(record.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="hidden md:block overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Producto
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Codigo
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Cantidad (Unidad(es))
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Lote
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Fecha de vencimiento
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Acciones
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {records.map((record) => (
                            <tr key={record.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {record.product?.name || "Producto eliminado"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {record.product?.productCode || "-"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {record.quantity}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {record.lotNumber}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {record.expirationDate}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center space-x-2">
                                  {hasPermission("UPDATE_PAYROLL") && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      title="Editar"
                                      onClick={() => handleEdit(record)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {hasPermission("DELETE_PAYROLL") && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      title="Eliminar"
                                      onClick={() => handleDelete(record.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Pagina {currentPage} de {totalPages}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={currentPage === 1}
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(prev + 1, totalPages),
                          )
                        }
                        disabled={currentPage === totalPages}
                      >
                        Siguiente
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <CreateInventoryModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            loadRecords();
            loadSummary();
          }}
        />

        {selectedRecord && (
          <EditInventoryModal
            isOpen={showEditModal}
            onClose={handleCloseEditModal}
            onSuccess={() => {
              loadRecords();
              loadSummary();
            }}
            record={selectedRecord}
          />
        )}

        <ConfirmDialog
          isOpen={confirmState.isOpen}
          title={confirmState.title}
          message={confirmState.message}
          confirmText={confirmState.confirmText}
          cancelText={confirmState.cancelText}
          confirmVariant={confirmState.confirmVariant}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      </div>
    </ProtectedRoute>
  );
}
