import { useState, useEffect } from 'react';
import { User, Phone, MapPin, Car, Truck, Loader2 } from 'lucide-react';
import { api } from '../../lib/api';
import { toast } from 'react-hot-toast';

const CustomerDetails = ({ 
  customerDetails, 
  onDetailsChange, 
  orderType, 
  onOrderTypeChange,
  className = "" 
}) => {
  const [formData, setFormData] = useState({
    customerName: '',
    customerMobile: '',
    orderType: 'dine-in',
    tableNumber: null,
    deliveryOrderNumber: '',
    ...customerDetails
  });
  
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [customerFound, setCustomerFound] = useState(false);

  const orderTypes = [
    {
      value: 'dine-in',
      label: 'Dine In',
      icon: MapPin,
      color: 'bg-blue-600',
      description: 'Eat at restaurant'
    },
    {
      value: 'takeaway',
      label: 'Takeaway',
      icon: Car,
      color: 'bg-green-600',
      description: 'Customer pickup'
    },
    {
      value: 'pickme',
      label: 'PickMe',
      icon: Truck,
      color: 'bg-yellow-600',
      description: 'PickMe delivery'
    },
    {
      value: 'uber',
      label: 'Uber Eats',
      icon: Truck,
      color: 'bg-black',
      description: 'Uber delivery'
    }
  ];

  // Update form data when props change
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      ...customerDetails,
      orderType: orderType || prev.orderType
    }));
  }, [customerDetails, orderType]);
  
  // Auto-fetch customer name when valid mobile number is entered
  useEffect(() => {
    const fetchCustomerByPhone = async () => {
      const mobile = formData.customerMobile;
      
      // Only fetch if mobile is valid and name is empty
      if (!validateMobileNumber(mobile) || !mobile) {
        setCustomerFound(false);
        return;
      }
      
      setIsSearchingCustomer(true);
      setCustomerFound(false);
      
      try {
        const response = await api.get(`/campaigns/customers/search?phone=${mobile}`);
        
        if (response.data.found && response.data.customer) {
          const customer = response.data.customer;
          
          // Auto-fill customer name if it's empty
          if (!formData.customerName) {
            const updatedData = {
              ...formData,
              customerName: customer.name
            };
            setFormData(updatedData);
            onDetailsChange(updatedData);
            setCustomerFound(true);
            
            toast.success(`Welcome back, ${customer.name}! 👋`, {
              duration: 3000,
              icon: '🎉',
              style: {
                borderRadius: '10px',
                background: '#1f2937',
                color: '#fff',
              },
            });
          }
        }
      } catch (error) {
        console.error('Error fetching customer:', error);
        // Silent fail - don't show error to user as this is optional
      } finally {
        setIsSearchingCustomer(false);
      }
    };
    
    // Debounce the API call
    const timeoutId = setTimeout(() => {
      if (formData.customerMobile && formData.customerMobile.length === 10) {
        fetchCustomerByPhone();
      }
    }, 800); // Wait 800ms after user stops typing
    
    return () => clearTimeout(timeoutId);
  }, [formData.customerMobile]);

  const handleInputChange = (field, value) => {
    const newFormData = {
      ...formData,
      [field]: value
    };
    
    setFormData(newFormData);
    onDetailsChange(newFormData);
  };

  const handleOrderTypeChange = (newOrderType) => {
    const updatedData = {
      ...formData,
      orderType: newOrderType,
      // Reset table number if not dine-in
      tableNumber: newOrderType === 'dine-in' ? formData.tableNumber : null
    };
    
    setFormData(updatedData);
    onDetailsChange(updatedData);
    onOrderTypeChange(newOrderType);
  };

  const formatPhoneNumber = (value) => {
    // Remove all non-digits
    const phoneNumber = value.replace(/\D/g, '');
    
    // Limit to 10 digits for Sri Lankan mobile numbers
    if (phoneNumber.length <= 10) {
      return phoneNumber;
    }
    
    return phoneNumber.slice(0, 10);
  };

  const validateMobileNumber = (mobile) => {
    if (!mobile) return true; // Optional field
    
    // Sri Lankan mobile number validation (starts with 07 and has 10 digits)
    const mobileRegex = /^07[0-9]{8}$/;
    return mobileRegex.test(mobile);
  };

  const isMobileValid = validateMobileNumber(formData.customerMobile);

  return (
    <div className={`bg-slate-800 rounded-lg p-4 border border-slate-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center space-x-2 mb-4">
        <User className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-semibold text-white">Customer Details</h3>
        <span className="text-xs text-slate-400">(Optional)</span>
      </div>

      {/* Order Type Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Order Type
        </label>
        <div className="grid grid-cols-2 gap-2">
          {orderTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = formData.orderType === type.value;
            
            return (
              <button
                key={type.value}
                onClick={() => handleOrderTypeChange(type.value)}
                className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                  isSelected
                    ? `${type.color} border-white text-white shadow-lg`
                    : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-slate-500'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Icon className="w-4 h-4" />
                  <div className="text-left">
                    <div className="font-medium text-sm">{type.label}</div>
                    <div className="text-xs opacity-80">{type.description}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Customer Information */}
      <div className="space-y-3">
        {/* Customer Name */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Customer Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={formData.customerName}
              onChange={(e) => handleInputChange('customerName', e.target.value)}
              placeholder="Enter customer name (optional)"
              className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              maxLength="50"
            />
          </div>
        </div>

        {/* Mobile Number */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Mobile Number
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="tel"
              value={formData.customerMobile}
              onChange={(e) => {
                const formatted = formatPhoneNumber(e.target.value);
                handleInputChange('customerMobile', formatted);
                setCustomerFound(false); // Reset found status when user types
              }}
              placeholder="07X XXX XXXX (optional)"
              className={`w-full pl-10 pr-10 py-2 bg-slate-700 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-blue-500 ${
                formData.customerMobile && !isMobileValid
                  ? 'border-red-500 focus:ring-red-500'
                  : customerFound
                  ? 'border-green-500 focus:ring-green-500'
                  : 'border-slate-600 focus:ring-blue-500'
              }`}
              maxLength="10"
            />
            {isSearchingCustomer && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-400 animate-spin" />
            )}
          </div>
          {formData.customerMobile && !isMobileValid && (
            <p className="text-red-400 text-xs mt-1">
              Please enter a valid Sri Lankan mobile number (07X XXX XXXX)
            </p>
          )}
          {formData.customerMobile && isMobileValid && !customerFound && !isSearchingCustomer && (
            <p className="text-green-400 text-xs mt-1">
              ✓ Valid mobile number
            </p>
          )}
          {customerFound && (
            <p className="text-green-400 text-xs mt-1 flex items-center gap-1">
              ✓ Existing customer found - Name auto-filled
            </p>
          )}
        </div>

        {/* Delivery Order Number - Only for PickMe and Uber */}
        {(formData.orderType === 'pickme' || formData.orderType === 'uber') && (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              {formData.orderType === 'pickme' ? 'PickMe Order Number' : 'Uber Eats Order Number'}
            </label>
            <div className="relative">
              <Truck className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={formData.deliveryOrderNumber}
                onChange={(e) => handleInputChange('deliveryOrderNumber', e.target.value)}
                placeholder={`Enter ${formData.orderType === 'pickme' ? 'PickMe' : 'Uber'} order number`}
                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                maxLength="50"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {formData.orderType === 'pickme' 
                ? 'Enter the PickMe order reference number for tracking'
                : 'Enter the Uber Eats order ID for tracking'
              }
            </p>
          </div>
        )}

        {/* Additional Info for Delivery Orders */}
        {(formData.orderType === 'pickme' || formData.orderType === 'uber') && (
          <div className="bg-slate-700/50 p-3 rounded-lg border border-slate-600">
            <div className="flex items-center space-x-2 mb-2">
              <Truck className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-yellow-400">
                Delivery Order
              </span>
            </div>
            <p className="text-xs text-slate-300">
              {formData.orderType === 'pickme' 
                ? 'This order will be prepared for PickMe delivery'
                : 'This order will be prepared for Uber Eats delivery'
              }
            </p>
            {formData.customerMobile && (
              <p className="text-xs text-green-400 mt-1">
                Customer contact: {formData.customerMobile}
              </p>
            )}
            {formData.deliveryOrderNumber && (
              <p className="text-xs text-blue-400 mt-1">
                Order #{formData.deliveryOrderNumber}
              </p>
            )}
          </div>
        )}

        {/* Order Summary */}
        <div className="bg-slate-700/30 p-3 rounded-lg">
          <div className="text-xs text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Order Type:</span>
              <span className="text-white font-medium">
                {orderTypes.find(t => t.value === formData.orderType)?.label}
              </span>
            </div>
            {formData.customerName && (
              <div className="flex justify-between">
                <span>Customer:</span>
                <span className="text-white">{formData.customerName}</span>
              </div>
            )}
            {formData.customerMobile && isMobileValid && (
              <div className="flex justify-between">
                <span>Mobile:</span>
                <span className="text-white">{formData.customerMobile}</span>
              </div>
            )}
            {formData.deliveryOrderNumber && (
              <div className="flex justify-between">
                <span>Delivery #:</span>
                <span className="text-white">{formData.deliveryOrderNumber}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetails;