import React, { useState } from 'react';
import { useProducts } from '@/hooks/useProducts.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PlusCircle, Edit, Trash2, Loader2 } from 'lucide-react';

const ProductForm = ({ product, onSave, onDone }) => {
  const [formData, setFormData] = useState({
    type: product?.type || 'produto',
    code: product?.code || '',
    name: product?.name || '',
    sale_price: product?.sale_price || '',
    cost_price: product?.cost_price || '',
    rental_period: product?.rental_period || '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const dataToSave = {
      type: formData.type,
      code: formData.code,
      name: formData.name,
      sale_price: parseFloat(formData.sale_price) || 0,
      cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null,
      rental_period: formData.type === 'locação' ? formData.rental_period : null,
    };
    await onSave(dataToSave);
    setIsSaving(false);
    onDone();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="type">Tipo</Label>
        <Select name="type" value={formData.type} onValueChange={(value) => handleSelectChange('type', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="produto">Produto</SelectItem>
            <SelectItem value="serviço">Serviço</SelectItem>
            <SelectItem value="locação">Locação</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {formData.type === 'locação' && (
        <div>
          <Label htmlFor="rental_period">Período de Locação</Label>
          <Select name="rental_period" value={formData.rental_period} onValueChange={(value) => handleSelectChange('rental_period', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="diária">Diária</SelectItem>
              <SelectItem value="semanal">Semanal</SelectItem>
              <SelectItem value="mensal">Mensal</SelectItem>
              <SelectItem value="anual">Anual</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      <div>
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
      </div>
      <div>
        <Label htmlFor="code">Código</Label>
        <Input id="code" name="code" value={formData.code} onChange={handleChange} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="sale_price">Valor (R$)</Label>
          <Input id="sale_price" name="sale_price" type="number" step="0.01" value={formData.sale_price} onChange={handleChange} required />
        </div>
        <div>
          <Label htmlFor="cost_price">Custo (R$)</Label>
          <Input id="cost_price" name="cost_price" type="number" step="0.01" value={formData.cost_price} onChange={handleChange} />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onDone}>Cancelar</Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Salvar
        </Button>
      </DialogFooter>
    </form>
  );
};

const ProductsContent = () => {
  const { products, loading, addProduct, updateProduct, deleteProduct } = useProducts();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const handleSave = async (productData) => {
    if (editingProduct) {
      await updateProduct(editingProduct.id, productData);
    } else {
      await addProduct(productData);
    }
  };

  const openFormForEdit = (product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const openFormForNew = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">Gerenciar Produtos e Serviços</h2>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={openFormForNew}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Editar' : 'Adicionar'} Item</DialogTitle>
            </DialogHeader>
            <ProductForm
              product={editingProduct}
              onSave={handleSave}
              onDone={() => setIsFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Custo</TableHead>
                <TableHead>Período</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="capitalize">{product.type}</TableCell>
                  <TableCell>{product.code || 'N/A'}</TableCell>
                  <TableCell>{formatCurrency(product.sale_price)}</TableCell>
                  <TableCell>{formatCurrency(product.cost_price)}</TableCell>
                  <TableCell className="capitalize">{product.rental_period || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openFormForEdit(product)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir "{product.name}"? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteProduct(product.id)} className="bg-red-600 hover:bg-red-700">Excluir</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {products.length === 0 && (
            <p className="text-center text-gray-500 py-10">Nenhum produto ou serviço cadastrado.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductsContent;