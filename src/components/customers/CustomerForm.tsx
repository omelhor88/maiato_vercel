import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

interface CustomerFormProps {
  customer?: any;
  onSuccess: () => void;
}

export const CustomerForm = ({ customer, onSuccess }: CustomerFormProps) => {
  const isEditing = !!customer;
  const [formData, setFormData] = useState({
    name: customer?.name || "",
    email: customer?.email || "",
    phone: customer?.phone || "",
    phone2: customer?.phone2 || "",
    address: customer?.address || "",
    nif: customer?.nif || "",
    spouse_nif: customer?.spouse_nif || "",
    birth_date: customer?.birth_date || "",
    title_code: customer?.title_code || "",
    profession_code: customer?.profession_code || "",
    postal_code: customer?.postal_code || "",
    internet: customer?.internet || "",
    spouse_internet: customer?.spouse_internet || "",
    nib: customer?.nib || "",
    niss: customer?.niss || "",
    social_security_code: customer?.social_security_code || "",
    mobile_key: customer?.mobile_key || "",
    notes: customer?.notes || "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showMobileKey, setShowMobileKey] = useState(false);
  const [showSecurityCode, setShowSecurityCode] = useState(false);

  const queryClient = useQueryClient();

  // Fetch titles
  const { data: titles } = useQuery({
    queryKey: ["titles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("titles")
        .select("*")
        .order("id");
      if (error) throw error;
      return data;
    },
  });

  // Fetch professions
  const { data: professions } = useQuery({
    queryKey: ["professions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("professions")
        .select("*")
        .order("id");
      if (error) throw error;
      return data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (customer) {
        const { error } = await supabase.from("customers").update(data).eq("id", customer.id);
        if (error) throw error;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase.from("customers").insert([{ ...data, user_id: user?.id || '00000000-0000-0000-0000-000000000000' }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success(customer ? "Cliente atualizado com sucesso" : "Cliente criado com sucesso");
      onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <ScrollArea className="max-h-[calc(90vh-8rem)] pr-4">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Nome Completo */}
        <div>
          <Label htmlFor="name" className="flex items-center gap-2">
            <span className="text-primary">👤</span> Nome Completo *
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Digite o nome completo"
            required
            className="mt-1.5"
          />
        </div>

        {/* NIF e Data de Nascimento */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="nif">NIF *</Label>
            <Input
              id="nif"
              value={formData.nif}
              onChange={(e) => setFormData({ ...formData, nif: e.target.value })}
              placeholder="123456789"
              required
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="birth_date" className="flex items-center gap-2">
              <span className="text-primary">📅</span> Data de Nascimento
            </Label>
            <Input
              id="birth_date"
              type="date"
              value={formData.birth_date}
              onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
              className="mt-1.5"
            />
          </div>
        </div>

        {/* Email e Telefone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="email" className="flex items-center gap-2">
              <span className="text-primary">✉️</span> Email
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@exemplo.com"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="phone" className="flex items-center gap-2">
              <span className="text-primary">📞</span> Telefone *
            </Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+351 912 345 678"
              required
              className="mt-1.5"
            />
          </div>
        </div>

        {/* Telefone 2 */}
        <div>
          <Label htmlFor="phone2">Telefone 2</Label>
          <Input
            id="phone2"
            value={formData.phone2}
            onChange={(e) => setFormData({ ...formData, phone2: e.target.value })}
            placeholder="+351 912 345 678"
            className="mt-1.5"
          />
        </div>

        {/* Morada */}
        <div>
          <Label htmlFor="address" className="flex items-center gap-2">
            <span className="text-primary">📍</span> Morada
          </Label>
          <Textarea
            id="address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Rua, número, andar, etc."
            className="mt-1.5"
          />
        </div>

        {/* Código Postal e Título */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="postal_code">Código Postal</Label>
            <Input
              id="postal_code"
              value={formData.postal_code}
              onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
              placeholder="1000-000"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="title_code">Título</Label>
            <Select
              value={formData.title_code}
              onValueChange={(value) => setFormData({ ...formData, title_code: value })}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {titles?.map((title) => (
                  <SelectItem key={title.id} value={title.id.toString()}>
                    {title.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Profissão e Password Portal das Finanças */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="profession_code" className="flex items-center gap-2">
              <span className="text-primary">💼</span> Profissão
            </Label>
            <Select
              value={formData.profession_code}
              onValueChange={(value) => setFormData({ ...formData, profession_code: value })}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {professions?.map((profession) => (
                  <SelectItem key={profession.id} value={profession.id.toString()}>
                    {profession.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="internet" className="flex items-center gap-2">
              <span className="text-primary">🔐</span> Password Portal das Finanças
            </Label>
            <div className="relative mt-1.5">
              <Input
                id="internet"
                type={!isEditing || showPassword ? "text" : "password"}
                value={formData.internet}
                onChange={(e) => setFormData({ ...formData, internet: e.target.value })}
                placeholder="Password do portal"
                className="pr-10"
              />
              {isEditing && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* NIB e NISS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="nib">NIB</Label>
            <Input
              id="nib"
              value={formData.nib}
              onChange={(e) => setFormData({ ...formData, nib: e.target.value })}
              placeholder="PT50..."
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="niss">NISS (Nº Segurança Social)</Label>
            <Input
              id="niss"
              value={formData.niss}
              onChange={(e) => setFormData({ ...formData, niss: e.target.value })}
              placeholder="12345678901"
              className="mt-1.5"
            />
          </div>
        </div>

        {/* Código de Segurança do NISS e Chave Móvel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="social_security_code" className="flex items-center gap-2">
              <span className="text-primary">🔢</span> Código de Segurança do NISS
            </Label>
            <div className="relative mt-1.5">
              <Input
                id="social_security_code"
                type={!isEditing || showSecurityCode ? "text" : "password"}
                value={formData.social_security_code}
                onChange={(e) => setFormData({ ...formData, social_security_code: e.target.value })}
                placeholder="Código de segurança"
                className="pr-10"
              />
              {isEditing && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowSecurityCode(!showSecurityCode)}
                >
                  {showSecurityCode ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              )}
            </div>
          </div>
          <div>
            <Label htmlFor="mobile_key" className="flex items-center gap-2">
              <span className="text-primary">📱</span> Chave Móvel Digital
            </Label>
            <div className="relative mt-1.5">
              <Input
                id="mobile_key"
                type={!isEditing || showMobileKey ? "text" : "password"}
                value={formData.mobile_key}
                onChange={(e) => setFormData({ ...formData, mobile_key: e.target.value })}
                placeholder="Chave móvel"
                className="pr-10"
              />
              {isEditing && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowMobileKey(!showMobileKey)}
                >
                  {showMobileKey ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Notas */}
        <div>
          <Label htmlFor="notes">Notas</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Informações adicionais..."
            className="mt-1.5"
          />
        </div>

        <Button type="submit" className="w-full">
          {customer ? "Atualizar" : "Criar"} Cliente
        </Button>
      </form>
    </ScrollArea>
  );
};
