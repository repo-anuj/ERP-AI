"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Plus, Trash2, Package, AlertCircle } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

// Define inventory item type
type InventoryItem = {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  price: number;
  status: string;
  description?: string;
};

// Schema for sale item
const saleItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  product: z.string().min(2, "Product name is required"),
  description: z.string().optional(),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  unitPrice: z.coerce.number().min(0, "Price cannot be negative"),
});

// Schema for customer
const customerSchema = z.object({
  name: z.string().min(2, "Customer name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
});

// Schema for the entire form
const formSchema = z.object({
  customer: customerSchema,
  items: z.array(saleItemSchema).min(1, "At least one item is required"),
  date: z.date(),
  status: z.enum(["pending", "completed", "cancelled"]),
  notes: z.string().optional().or(z.literal("")),
  invoiceNumber: z.string().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

export function AddSaleDialog() {
  const [open, setOpen] = useState(false)
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Fetch inventory items when dialog opens
  useEffect(() => {
    if (open) {
      fetchInventoryItems()
    }
  }, [open])

  // Fetch inventory items from API
  const fetchInventoryItems = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/inventory")
      
      if (!response.ok) {
        throw new Error("Failed to fetch inventory items")
      }
      
      const data = await response.json()
      if (data.items && Array.isArray(data.items)) {
        setInventoryItems(data.items)
      } else {
        console.error("Invalid inventory data format:", data)
        setInventoryItems([])
        toast({
          title: "Error",
          description: "Invalid inventory data format received",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching inventory:", error)
      toast({
        title: "Error",
        description: "Failed to load inventory items",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Initialize form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customer: {
        name: "",
        email: "",
        phone: "",
        address: "",
      },
      items: [
        {
          productId: "",
          product: "",
          description: "",
          quantity: 1,
          unitPrice: 0,
        },
      ],
      date: new Date(),
      status: "pending",
      notes: "",
      invoiceNumber: "",
    },
  })

  // Add a new item to the form
  const addItem = () => {
    const currentItems = form.getValues("items")
    form.setValue("items", [
      ...currentItems,
      {
        productId: "",
        product: "",
        description: "",
        quantity: 1,
        unitPrice: 0,
      },
    ])
  }

  // Remove an item from the form
  const removeItem = (index: number) => {
    const currentItems = form.getValues("items")
    if (currentItems.length > 1) {
      form.setValue(
        "items",
        currentItems.filter((_, i) => i !== index)
      )
    }
  }

  // Handle product selection
  const handleProductSelect = (productId: string, index: number) => {
    const selectedProduct = inventoryItems.find(item => item.id === productId)
    
    if (selectedProduct) {
      form.setValue(`items.${index}.productId`, selectedProduct.id)
      form.setValue(`items.${index}.product`, selectedProduct.name)
      form.setValue(`items.${index}.description`, selectedProduct.description || "")
      form.setValue(`items.${index}.unitPrice`, selectedProduct.price)
    }
  }

  // Calculate total for an item
  const calculateItemTotal = (item: { quantity: number; unitPrice: number }) => {
    return item.quantity * item.unitPrice
  }

  // Calculate total for the entire sale
  const calculateTotal = () => {
    const items = form.getValues("items")
    return items.reduce((sum, item) => sum + calculateItemTotal(item), 0)
  }

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    try {
      // Validate inventory quantities
      const validationErrors = []
      
      for (const item of data.items) {
        const inventoryItem = inventoryItems.find(invItem => invItem.id === item.productId)
        
        if (!inventoryItem) {
          validationErrors.push(`Product "${item.product}" not found in inventory`)
          continue
        }
        
        if (inventoryItem.quantity < item.quantity) {
          validationErrors.push(`Insufficient quantity for "${item.product}". Available: ${inventoryItem.quantity}, Requested: ${item.quantity}`)
        }
      }
      
      if (validationErrors.length > 0) {
        toast({
          title: "Validation Error",
          description: (
            <ul className="list-disc pl-5">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          ),
          variant: "destructive",
        })
        return
      }

      // Calculate total for each item and the overall total
      const itemsWithTotal = data.items.map(item => ({
        ...item,
        total: calculateItemTotal(item),
      }))

      const total = itemsWithTotal.reduce((sum, item) => sum + item.total, 0)

      // Prepare the data for API submission
      const saleData = {
        customer: data.customer,
        items: itemsWithTotal,
        date: data.date.toISOString(),
        status: data.status,
        total,
        notes: data.notes,
        invoiceNumber: data.invoiceNumber,
      }

      // Submit the data to the API
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(saleData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create sale")
      }

      // Show success message
      toast({
        title: "Sale created",
        description: "The sale has been created successfully.",
      })

      // Close the dialog and refresh the page
      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error creating sale:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create sale",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Sale
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Sale</DialogTitle>
          <DialogDescription>
            Select products from your inventory to sell to a customer.
          </DialogDescription>
        </DialogHeader>
        
        {inventoryItems.length === 0 && !loading && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-amber-800">No inventory items found</h3>
                <p className="text-sm text-amber-700 mt-1">
                  You need to add products to your inventory before you can create a sale.
                </p>
              </div>
            </div>
          </div>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Customer Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Customer Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="customer.name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Name*</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter customer name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="customer.email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="customer@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="customer.phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="Phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="customer.address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Customer address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Sale Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Sale Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date*</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status*</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="invoiceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invoice Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Invoice number (optional)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Sale Items */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Package className="h-5 w-5 mr-2 text-muted-foreground" />
                  <h3 className="text-lg font-medium">Products*</h3>
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={addItem}
                  disabled={inventoryItems.length === 0}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
              </div>
              
              {loading ? (
                <div className="text-center py-4">Loading inventory items...</div>
              ) : (
                form.watch("items").map((_, index) => (
                  <div key={index} className="space-y-4 p-4 border rounded-md">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Item {index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                        disabled={form.watch("items").length <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`items.${index}.productId`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Select Product*</FormLabel>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value)
                                handleProductSelect(value, index)
                              }}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a product" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="max-h-[300px]">
                                {inventoryItems.map((item) => (
                                  <SelectItem 
                                    key={item.id} 
                                    value={item.id}
                                    disabled={item.quantity <= 0}
                                  >
                                    <div className="flex flex-col">
                                      <span className="font-medium">{item.name}</span>
                                      <span className="text-xs text-muted-foreground">
                                        {item.quantity > 0 
                                          ? `${item.quantity} in stock • ${formatCurrency(item.price)}`
                                          : 'Out of stock'
                                        }
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity*</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                placeholder="Quantity"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`items.${index}.product`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Product Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Product name" 
                                {...field} 
                                disabled 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`items.${index}.unitPrice`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unit Price*</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="Unit price"
                                {...field}
                                disabled
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`items.${index}.description`}
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Description (optional)" 
                                {...field} 
                                disabled
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="text-right font-medium">
                      Item Total: ${calculateItemTotal({
                        quantity: form.watch(`items.${index}.quantity`) || 0,
                        unitPrice: form.watch(`items.${index}.unitPrice`) || 0,
                      }).toFixed(2)}
                    </div>
                  </div>
                ))
              )}
              
              <div className="text-right font-medium text-lg">
                Total: ${calculateTotal().toFixed(2)}
              </div>
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes about this sale (optional)"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Sale</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
