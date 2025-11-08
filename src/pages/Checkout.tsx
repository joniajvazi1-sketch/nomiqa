import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, ShoppingCart, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

const emailSchema = z.string().email("Please enter a valid email address");

export default function Checkout() {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, clearCart, total } = useCart();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Create orders in database (without eSIM provisioning yet)
      const orderIds = [];
      for (const item of items) {
        const { data: order, error } = await supabase
          .from('orders')
          .insert({
            user_id: user?.id || null,
            email,
            product_id: item.product.id,
            package_name: item.product.name,
            data_amount: item.product.data_amount,
            validity_days: item.product.validity_days,
            total_amount_usd: item.product.price_usd,
            status: 'pending_payment',
          })
          .select()
          .single();

        if (error) throw error;
        orderIds.push(order.id);
      }

      // Create NowPayments invoice for all items
      const totalAmount = items.reduce((sum, item) => sum + item.product.price_usd, 0);
      const { data, error } = await supabase.functions.invoke('create-nowpayments-invoice', {
        body: {
          orderId: orderIds[0], // Using first order ID as reference
          email,
        }
      });

      if (error) throw error;

      if (data.invoiceUrl) {
        // Redirect to NowPayments checkout
        window.location.href = data.invoiceUrl;
      } else {
        throw new Error('Failed to create payment invoice');
      }
      
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.message || "Failed to create payment. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">
              Add some eSIM packages to get started
            </p>
            <Button onClick={() => navigate('/')}>
              Browse Packages
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Shop
        </Button>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="md:col-span-2 space-y-4">
            <h1 className="text-3xl font-bold mb-6">Checkout</h1>
            
            {items.map((item) => (
              <Card key={item.product.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{item.product.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {item.product.country_name} • {item.product.data_amount} • {item.product.validity_days} days
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          >
                            -
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          >
                            +
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">${(item.product.price_usd * item.quantity).toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">${item.product.price_usd.toFixed(2)} each</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
                <CardDescription>Complete your purchase</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Your eSIM details will be sent here
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal ({items.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-2">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Processing...' : 'Complete Order'}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    By placing your order, you agree to our terms and conditions
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}