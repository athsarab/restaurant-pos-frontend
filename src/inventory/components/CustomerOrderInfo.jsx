import { User, Phone, MapPin, Car, Truck } from 'lucide-react';

const CustomerOrderInfo = ({ order }) => {
  if (!order) return null;

  const getOrderTypeInfo = (orderType) => {
    switch (orderType) {
      case 'dine-in':
        return { icon: MapPin, label: 'Dine In', color: 'text-blue-400' };
      case 'takeaway':
        return { icon: Car, label: 'Takeaway', color: 'text-green-400' };
      case 'pickme':
        return { icon: Truck, label: 'PickMe', color: 'text-yellow-400' };
      case 'uber':
        return { icon: Truck, label: 'Uber Eats', color: 'text-gray-400' };
      default:
        return { icon: MapPin, label: 'Order', color: 'text-slate-400' };
    }
  };

  const orderTypeInfo = getOrderTypeInfo(order.orderType);
  const OrderIcon = orderTypeInfo.icon;

  const hasCustomerInfo = order.customerName || order.customerMobile;

  if (!hasCustomerInfo) return null;

  return (
    <div className="bg-slate-700/30 p-3 rounded-lg border border-slate-600">
      <div className="flex items-center space-x-2 mb-2">
        <OrderIcon className={`w-4 h-4 ${orderTypeInfo.color}`} />
        <span className={`text-sm font-medium ${orderTypeInfo.color}`}>
          {orderTypeInfo.label} Order
        </span>
      </div>
      
      <div className="space-y-1">
        {order.customerName && (
          <div className="flex items-center space-x-2 text-xs">
            <User className="w-3 h-3 text-slate-400" />
            <span className="text-slate-300">{order.customerName}</span>
          </div>
        )}
        
        {order.customerMobile && (
          <div className="flex items-center space-x-2 text-xs">
            <Phone className="w-3 h-3 text-slate-400" />
            <span className="text-slate-300">{order.customerMobile}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerOrderInfo;