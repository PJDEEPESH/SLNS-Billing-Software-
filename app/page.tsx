"use client";
import { useState, useEffect, useRef } from "react";
import {
  Printer, FileText, Users, Save, Trash2,
  History, ArrowLeft, Plus, Edit3, Download, X, Check, Package,
  Upload, Image as ImageIcon, LayoutDashboard, Search, Calendar, DollarSign
} from "lucide-react";

// --- CONFIGURATION ---
const COMPANY_DETAILS = {
  name: "SRI LAXMI NARASIMHA SWAMY WELDING WORKS",
  desc: "Trader : Column Boxes, Centring Boxes.",
  address: "Office: Sy No:45, H.No:1-35-462/4, BHEL Colony,Rasoolpura, Secunderabad,Telangana.",
  contact: "E-mail: srikanthkittu6@gmail.com Mobile No: 9394749715,9989989638.",
  gstin: "36ADSFS2351R1Z6",
  bankName: "UNION BANK OF INDIA",
  branch: "R.P ROAD, SECUNDERABAD",
  accNo: "050511100004632",
  ifsc: "UBIN0805050"
};

// --- MOCK DATA ---
const INITIAL_CUSTOMERS = [
  { id: 1, name: "SRI VENKATESWARA CENTRING SUPPILERS WORKS", address: "MVV HARMONY, FLAT NO:204-3-80/12, YENDADA, VISAKHAPATNAM, A.P", gst: "37BTIPP0332G1ZS", state: "ANDHRA PRADESH", stateCode: "37", destination: "ARILOVA, VISAKHAPATNAM" },
  { id: 2, name: "ABC CONSTRUCTIONS", address: "Banjara Hills, Hyderabad, Telangana", gst: "36ADSF1234Z1", state: "TELANGANA", stateCode: "36", destination: "HYDERABAD" },
];

const INITIAL_PRODUCTS = [
  { id: 101, name: "MS CENTRING SHEETS", hsn: "7308", unit: "Kgs", rate: 73.00, image: null },
  { id: 102, name: "SCAFFOLDING PIPES", hsn: "7306", unit: "Nos", rate: 450.00, image: null },
  { id: 103, name: "U JACKS", hsn: "7326", unit: "Nos", rate: 120.00, image: null },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard"); // Default is now Dashboard

  // Data State
  const [customers, setCustomers] = useState(INITIAL_CUSTOMERS);
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [savedInvoices, setSavedInvoices] = useState<any[]>([]);

  // Dashboard Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  // View States
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastSavedInvoice, setLastSavedInvoice] = useState<any>(null);

  // Product View States
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [newProduct, setNewProduct] = useState({ name: "", hsn: "", unit: "Kgs", rate: "", image: null as string | null });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New Customer Input
  const [newCustomer, setNewCustomer] = useState({ name: "", address: "", gst: "", state: "", stateCode: "", destination: "" });

  // Invoice Form State
  const [formData, setFormData] = useState({
    customerId: "",
    invNo: "20/25-26", // Start value
    date: new Date().toISOString().split('T')[0],
    deliveryNote: "",
    paymentMode: "CREDIT",
    buyersOrderNo: "",
    dispatchDocNo: "",
    destination: "",
    dispatchThrough: "MOTOR VEHICLE",
    vehicleNo: "",
    terms: "",
    // Addresses
    cName: "", cAddress: "", cGst: "", cState: "", cStateCode: "",
    dName: "", dAddress: "", dGst: "", dState: "", dStateCode: "",
  });

  const [cart, setCart] = useState([
    { id: 1, productId: "", name: "", hsn: "", unit: "Kgs", qty: 0, rate: 0 }
  ]);

  // --- AUTO INVOICE NUMBER LOGIC ---
  const getNextInvoiceNumber = () => {
    if (savedInvoices.length === 0) return "20/25-26";
    const lastInv = savedInvoices[0].invNo;
    const parts = lastInv.split('/');
    if (parts.length === 2 && !isNaN(parseInt(parts[0]))) {
      const nextNum = parseInt(parts[0]) + 1;
      return `${nextNum}/${parts[1]}`;
    }
    return lastInv;
  };

  useEffect(() => {
    setFormData(prev => ({ ...prev, invNo: getNextInvoiceNumber() }));
  }, [savedInvoices]);

  // --- CALCULATIONS ---
  const calculate = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.qty * item.rate), 0);
    const taxRate = 0.18;
    const taxAmount = subtotal * taxRate;
    const grandTotal = subtotal + taxAmount;
    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
    const isInterState = formData.cStateCode !== "36";
    return { subtotal, taxAmount, grandTotal, totalQty, isInterState };
  };

  const { subtotal, taxAmount, grandTotal, totalQty, isInterState } = calculate();

  // --- DASHBOARD LOGIC ---
  const getFilteredInvoices = () => {
    return savedInvoices.filter(inv => {
      const matchesSearch =
        inv.invNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.customerName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDate =
        (!dateRange.start || inv.date >= dateRange.start) &&
        (!dateRange.end || inv.date <= dateRange.end);

      return matchesSearch && matchesDate;
    });
  };

  const togglePaymentStatus = (id: number) => {
    setSavedInvoices(savedInvoices.map(inv =>
      inv.id === id ? { ...inv, status: inv.status === "PAID" ? "PENDING" : "PAID" } : inv
    ));
  };

  const getTotalRevenue = () => savedInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const getPendingAmount = () => savedInvoices.filter(i => i.status === "PENDING").reduce((sum, inv) => sum + inv.amount, 0);

  // --- ACTIONS ---

  const handlePrint = (invoiceNo = formData.invNo, customerName = formData.cName) => {
    const cleanName = customerName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 15);
    const cleanInv = invoiceNo.replace('/', '-');
    const originalTitle = document.title;
    document.title = `Invoice_${cleanInv}_${cleanName}`;
    window.print();
    setTimeout(() => { document.title = originalTitle; }, 1000);
  };

  // Product Management
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const imageUrl = URL.createObjectURL(file);
      setNewProduct({ ...newProduct, image: imageUrl });
    }
  };

  const handleSaveProduct = () => {
    if (!newProduct.name || !newProduct.rate) return alert("Name and Rate are required");

    if (editingProductId) {
      setProducts(products.map(p => p.id === editingProductId ? {
        ...p, name: newProduct.name, hsn: newProduct.hsn, unit: newProduct.unit, rate: parseFloat(newProduct.rate), image: newProduct.image
      } : p));
      setEditingProductId(null);
    } else {
      const p = { id: Date.now(), name: newProduct.name, hsn: newProduct.hsn, unit: newProduct.unit, rate: parseFloat(newProduct.rate), image: newProduct.image };
      setProducts([...products, p]);
    }
    setIsAddingProduct(false);
    setNewProduct({ name: "", hsn: "", unit: "Kgs", rate: "", image: null });
  };

  const handleEditProduct = (product: any) => {
    setNewProduct({ name: product.name, hsn: product.hsn, unit: product.unit, rate: product.rate.toString(), image: product.image });
    setEditingProductId(product.id);
    setIsAddingProduct(true);
  };

  const handleDeleteProduct = (id: number) => {
    if (confirm("Are you sure you want to delete this item?")) setProducts(products.filter(p => p.id !== id));
  };

  // Customer Management
  const handleAddCustomer = () => {
    if (!newCustomer.name) return alert("Name is required");
    const c = { id: Date.now(), ...newCustomer };
    setCustomers([...customers, c]);
    setIsAddingCustomer(false);
    setNewCustomer({ name: "", address: "", gst: "", state: "", stateCode: "", destination: "" });
  };

  const handleUpdateCustomer = () => {
    setCustomers(customers.map(c => c.id === selectedCustomer.id ? selectedCustomer : c));
    setIsEditingProfile(false);
  };

  // Invoice Actions
  const handleCustomerSelect = (id: string) => {
    const c = customers.find(x => x.id.toString() === id);
    if (!c) return;
    setFormData(prev => ({
      ...prev,
      customerId: id,
      cName: c.name, cAddress: c.address, cGst: c.gst, cState: c.state, cStateCode: c.stateCode,
      dName: c.name, dAddress: c.address, dGst: c.gst, dState: c.state, dStateCode: c.stateCode,
      destination: c.destination
    }));
  };

  const handleSaveInvoice = () => {
    if (!formData.cName) { alert("Please select a customer first."); return; }

    const newInvoice = {
      id: Date.now(),
      invNo: formData.invNo,
      date: formData.date,
      customerName: formData.cName,
      customerId: formData.customerId,
      amount: grandTotal,
      status: "PENDING", // Default status
      data: { ...formData, cart: [...cart] }
    };

    setSavedInvoices([newInvoice, ...savedInvoices]);
    setLastSavedInvoice(newInvoice);
    setShowSuccessModal(true);
    setCart([{ id: 1, productId: "", name: "", hsn: "", unit: "Kgs", qty: 0, rate: 0 }]);
  };

  const loadAndPrintOldInvoice = (inv: any) => {
    setFormData(inv.data);
    setCart(inv.data.cart);
    setActiveTab('invoice');
    setTimeout(() => handlePrint(inv.invNo, inv.customerName), 500);
  };

  const numberToWords = (price: number) => {
    if (price === 0) return "ZERO RUPEES ONLY";
    return "FOURTY NINE THOUSAND FIVE HUNDRED THIRTY RUPEES ONLY"; // Simplified
  };

  return (
    <div className="min-h-screen bg-gray-100 flex font-sans text-gray-800 relative">
      {/* CSS FOR PRINTING */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #invoice-area, #invoice-area * { visibility: visible; }
          #invoice-area { position: absolute; left: 0; top: 0; width: 210mm; min-height: 297mm; margin: 0; padding: 0; background: white; }
          .no-print { display: none !important; }
          @page { size: A4; margin: 0; }
        }
      `}</style>

      {/* SUCCESS POPUP MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center no-print">
          <div className="bg-white p-6 rounded shadow-2xl text-center w-96">
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 p-3 rounded-full"><Check className="text-green-600" size={32} /></div>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Bill Generated!</h2>
            <p className="text-sm text-gray-500 mb-6">Invoice <strong>{lastSavedInvoice?.invNo}</strong> saved.</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => { handlePrint(lastSavedInvoice.invNo, lastSavedInvoice.customerName); setShowSuccessModal(false); }} className="w-full bg-[#EAA300] text-black font-bold py-2 rounded flex justify-center items-center gap-2 hover:bg-yellow-500">
                <Download size={18} /> Download PDF
              </button>
              <button onClick={() => setShowSuccessModal(false)} className="w-full bg-gray-200 text-gray-700 font-bold py-2 rounded hover:bg-gray-300">
                Close & Create Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <aside className="w-64 bg-[#0B2447] text-white flex flex-col fixed h-full z-10 no-print">
        <div className="p-6 bg-[#061a35] border-b border-blue-900">
          <h1 className="text-xl font-bold tracking-wider text-[#EAA300]">SLNS BILLING</h1>
        </div>
        <nav className="flex-1 p-2 space-y-2 mt-4">
          <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-3 w-full p-3 rounded ${activeTab === 'dashboard' ? 'bg-[#EAA300] text-black font-bold' : 'hover:bg-blue-900 text-gray-300'}`}>
            <LayoutDashboard size={18} /> Dashboard
          </button>
          <button onClick={() => { setActiveTab('invoice'); setSelectedCustomer(null); }} className={`flex items-center gap-3 w-full p-3 rounded ${activeTab === 'invoice' ? 'bg-[#EAA300] text-black font-bold' : 'hover:bg-blue-900 text-gray-300'}`}>
            <FileText size={18} /> Generate Bill
          </button>
          <button onClick={() => { setActiveTab('customers'); setSelectedCustomer(null); }} className={`flex items-center gap-3 w-full p-3 rounded ${activeTab === 'customers' ? 'bg-[#EAA300] text-black font-bold' : 'hover:bg-blue-900 text-gray-300'}`}>
            <Users size={18} /> Customers
          </button>
          <button onClick={() => setActiveTab('products')} className={`flex items-center gap-3 w-full p-3 rounded ${activeTab === 'products' ? 'bg-[#EAA300] text-black font-bold' : 'hover:bg-blue-900 text-gray-300'}`}>
            <Package size={18} /> Products
          </button>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="ml-64 w-full p-4 h-screen overflow-hidden flex gap-4">

        {/* === TAB: DASHBOARD === */}
        {activeTab === 'dashboard' && (
          <div className="w-full bg-white rounded shadow-lg p-8 overflow-y-auto no-print">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-blue-50 p-6 rounded border border-blue-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-blue-500 uppercase">Total Revenue</p>
                  <p className="text-2xl font-bold text-blue-900">₹ {getTotalRevenue().toLocaleString()}</p>
                </div>
                <DollarSign size={32} className="text-blue-300" />
              </div>
              <div className="bg-red-50 p-6 rounded border border-red-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-red-500 uppercase">Pending Payments</p>
                  <p className="text-2xl font-bold text-red-900">₹ {getPendingAmount().toLocaleString()}</p>
                </div>
                <History size={32} className="text-red-300" />
              </div>
              <div className="bg-yellow-50 p-6 rounded border border-yellow-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-yellow-600 uppercase">Total Invoices</p>
                  <p className="text-2xl font-bold text-yellow-900">{savedInvoices.length}</p>
                </div>
                <FileText size={32} className="text-yellow-400" />
              </div>
            </div>

            {/* Filters */}
            <div className="bg-gray-50 p-4 rounded border mb-6 flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs font-bold text-gray-500">Search (Inv No or Name)</label>
                <div className="flex items-center bg-white border rounded p-2 mt-1">
                  <Search size={16} className="text-gray-400 mr-2" />
                  <input
                    placeholder="e.g. 20/25-26 or ABC..."
                    className="w-full outline-none text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">From Date</label>
                <input type="date" className="border p-2 rounded mt-1 block text-sm bg-white" value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">To Date</label>
                <input type="date" className="border p-2 rounded mt-1 block text-sm bg-white" value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })} />
              </div>
              <button onClick={() => { setSearchTerm(""); setDateRange({ start: "", end: "" }) }} className="text-xs text-gray-500 hover:text-black underline p-2">Clear Filters</button>
            </div>

            {/* Table */}
            <div className="border rounded overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[#0B2447] text-white">
                  <tr>
                    <th className="p-3 text-left">Date</th>
                    <th className="p-3 text-left">Inv No</th>
                    <th className="p-3 text-left">Customer</th>
                    <th className="p-3 text-right">Amount</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredInvoices().length === 0 ? (
                    <tr><td colSpan={6} className="p-8 text-center text-gray-400">No invoices found.</td></tr>
                  ) : (
                    getFilteredInvoices().map(inv => (
                      <tr key={inv.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">{inv.date}</td>
                        <td className="p-3 font-bold">{inv.invNo}</td>
                        <td className="p-3">{inv.customerName}</td>
                        <td className="p-3 text-right font-bold">₹{inv.amount.toLocaleString()}</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => togglePaymentStatus(inv.id)}
                            className={`px-3 py-1 rounded-full text-[10px] font-bold ${inv.status === "PAID" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                          >
                            {inv.status}
                          </button>
                        </td>
                        <td className="p-3 text-center">
                          <button onClick={() => loadAndPrintOldInvoice(inv)} className="text-blue-600 hover:underline font-bold text-xs flex items-center justify-center gap-1">
                            <Printer size={14} /> View/Print
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* === TAB: PRODUCTS === */}
        {activeTab === 'products' && (
          <div className="w-full bg-white rounded shadow-lg p-8 overflow-y-auto no-print">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#0B2447]">Product Inventory</h2>
              <button onClick={() => { setIsAddingProduct(!isAddingProduct); setEditingProductId(null); setNewProduct({ name: "", hsn: "", unit: "Kgs", rate: "", image: null }); }} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded font-bold hover:bg-green-700">
                <Plus size={18} /> {isAddingProduct ? "Close Form" : "Add New Item"}
              </button>
            </div>
            {isAddingProduct && (
              <div className="bg-green-50 p-6 rounded border border-green-200 mb-8 flex gap-6">
                <div className="w-32 h-32 border-2 border-dashed border-green-300 rounded flex flex-col items-center justify-center cursor-pointer hover:bg-green-100 bg-white" onClick={() => fileInputRef.current?.click()}>
                  {newProduct.image ? <img src={newProduct.image} className="w-full h-full object-cover rounded" /> : <><Upload size={24} className="text-green-600 mb-2" /><span className="text-xs text-green-600 font-bold">Upload Photo</span></>}
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                </div>
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <input placeholder="Item Name" className="border p-2 rounded" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} />
                  <input placeholder="HSN Code" className="border p-2 rounded" value={newProduct.hsn} onChange={e => setNewProduct({ ...newProduct, hsn: e.target.value })} />
                  <div className="flex gap-2">
                    <input placeholder="Rate (Price)" type="number" className="border p-2 rounded w-2/3" value={newProduct.rate} onChange={e => setNewProduct({ ...newProduct, rate: e.target.value })} />
                    <select className="border p-2 rounded w-1/3" value={newProduct.unit} onChange={e => setNewProduct({ ...newProduct, unit: e.target.value })}>
                      <option>Kgs</option><option>Nos</option><option>Mtrs</option>
                    </select>
                  </div>
                  <div className="flex items-end gap-2">
                    <button onClick={handleSaveProduct} className="bg-green-600 text-white px-6 py-2 rounded font-bold w-full">{editingProductId ? "Update Item" : "Save New Item"}</button>
                    {editingProductId && <button onClick={() => { setIsAddingProduct(false); setEditingProductId(null); }} className="bg-gray-300 text-gray-700 px-4 py-2 rounded font-bold">Cancel</button>}
                  </div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map(p => (
                <div key={p.id} className="border rounded-lg p-4 flex gap-4 items-center hover:shadow-md bg-white relative group">
                  <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                    {p.image ? <img src={p.image} className="w-full h-full object-cover" /> : <ImageIcon className="text-gray-300" />}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-[#0B2447]">{p.name}</h3>
                    <p className="text-xs text-gray-500">HSN: {p.hsn}</p>
                    <p className="font-bold text-green-700 mt-1">₹{p.rate} / {p.unit}</p>
                  </div>
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEditProduct(p)} className="p-1.5 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"><Edit3 size={14} /></button>
                    <button onClick={() => handleDeleteProduct(p.id)} className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* === TAB: CUSTOMERS === */}
        {activeTab === 'customers' && (
          <div className="w-full bg-white rounded shadow-lg p-8 overflow-y-auto no-print">
            {!selectedCustomer && (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-[#0B2447]">All Customers</h2>
                  <button onClick={() => setIsAddingCustomer(!isAddingCustomer)} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded font-bold hover:bg-green-700">
                    <Plus size={18} /> Add New
                  </button>
                </div>
                {isAddingCustomer && (
                  <div className="bg-green-50 p-4 rounded border border-green-200 mb-6">
                    <h3 className="font-bold text-green-800 mb-3">New Customer Details</h3>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <input placeholder="Company Name" className="border p-2 rounded" value={newCustomer.name} onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })} />
                      <input placeholder="Full Address" className="border p-2 rounded" value={newCustomer.address} onChange={e => setNewCustomer({ ...newCustomer, address: e.target.value })} />
                      <input placeholder="GSTIN" className="border p-2 rounded" value={newCustomer.gst} onChange={e => setNewCustomer({ ...newCustomer, gst: e.target.value })} />
                      <input placeholder="State Name" className="border p-2 rounded" value={newCustomer.state} onChange={e => setNewCustomer({ ...newCustomer, state: e.target.value })} />
                      <input placeholder="State Code (e.g. 36)" className="border p-2 rounded" value={newCustomer.stateCode} onChange={e => setNewCustomer({ ...newCustomer, stateCode: e.target.value })} />
                      <input placeholder="Destination City" className="border p-2 rounded" value={newCustomer.destination} onChange={e => setNewCustomer({ ...newCustomer, destination: e.target.value })} />
                    </div>
                    <button onClick={handleAddCustomer} className="bg-green-600 text-white px-4 py-2 rounded text-sm font-bold">Save Customer</button>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {customers.map(c => (
                    <div key={c.id} onClick={() => { setSelectedCustomer(c); setIsEditingProfile(false); }} className="border p-4 rounded hover:shadow-md cursor-pointer hover:border-[#0B2447] bg-gray-50 transition-all group">
                      <h3 className="font-bold text-[#0B2447] group-hover:underline">{c.name}</h3>
                      <p className="text-xs text-gray-500 mt-2 truncate">{c.address}</p>
                      <p className="text-xs font-bold mt-2 text-blue-600">GST: {c.gst}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
            {selectedCustomer && (
              <div>
                <button onClick={() => setSelectedCustomer(null)} className="mb-4 flex items-center gap-2 text-gray-500 hover:text-black">
                  <ArrowLeft size={18} /> Back to List
                </button>
                <div className="flex gap-8">
                  <div className="w-1/3 border p-6 rounded bg-gray-50 h-fit">
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                      <h2 className="text-xl font-bold text-[#0B2447]">Profile</h2>
                      {!isEditingProfile && (
                        <button onClick={() => setIsEditingProfile(true)} className="text-xs flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200">
                          <Edit3 size={12} /> Edit
                        </button>
                      )}
                    </div>
                    {isEditingProfile ? (
                      <div className="space-y-3">
                        <div><label className="text-xs font-bold text-gray-500">Name</label><input className="w-full border p-2 rounded bg-white" value={selectedCustomer.name} onChange={e => setSelectedCustomer({ ...selectedCustomer, name: e.target.value })} /></div>
                        <div><label className="text-xs font-bold text-gray-500">Address</label><textarea className="w-full border p-2 rounded bg-white" rows={3} value={selectedCustomer.address} onChange={e => setSelectedCustomer({ ...selectedCustomer, address: e.target.value })} /></div>
                        <div><label className="text-xs font-bold text-gray-500">GSTIN</label><input className="w-full border p-2 rounded bg-white" value={selectedCustomer.gst} onChange={e => setSelectedCustomer({ ...selectedCustomer, gst: e.target.value })} /></div>
                        <div><label className="text-xs font-bold text-gray-500">State Code</label><input className="w-full border p-2 rounded bg-white" value={selectedCustomer.stateCode} onChange={e => setSelectedCustomer({ ...selectedCustomer, stateCode: e.target.value })} /></div>
                        <div className="flex gap-2 pt-2">
                          <button onClick={handleUpdateCustomer} className="flex-1 bg-green-600 text-white py-2 rounded font-bold">Save</button>
                          <button onClick={() => setIsEditingProfile(false)} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded font-bold">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div><p className="text-xs font-bold text-gray-400 uppercase">Name</p><p className="font-bold text-gray-800">{selectedCustomer.name}</p></div>
                        <div><p className="text-xs font-bold text-gray-400 uppercase">Address</p><p className="text-sm text-gray-600">{selectedCustomer.address}</p></div>
                        <div><p className="text-xs font-bold text-gray-400 uppercase">GSTIN</p><p className="text-sm font-mono bg-gray-200 px-2 py-1 rounded inline-block">{selectedCustomer.gst}</p></div>
                        <div><p className="text-xs font-bold text-gray-400 uppercase">State Code</p><p className="text-sm font-bold">{selectedCustomer.stateCode}</p></div>
                      </div>
                    )}
                  </div>
                  <div className="w-2/3">
                    <h2 className="text-xl font-bold text-[#0B2447] mb-4 flex items-center gap-2"><History /> Past Invoices</h2>
                    {savedInvoices.filter(inv => inv.customerId.toString() === selectedCustomer.id.toString()).length === 0 ? (
                      <div className="p-8 border rounded text-center text-gray-400 bg-gray-50">No bills generated yet.</div>
                    ) : (
                      <div className="space-y-3">
                        {savedInvoices.filter(inv => inv.customerId.toString() === selectedCustomer.id.toString()).map(inv => (
                          <div key={inv.id} className="flex justify-between items-center p-4 border rounded hover:shadow-md bg-white">
                            <div>
                              <p className="font-bold text-lg">#{inv.invNo}</p>
                              <p className="text-xs text-gray-500">Date: {inv.date}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-xl text-[#0B2447]">₹ {inv.amount.toLocaleString()}</p>
                              <button onClick={() => loadAndPrintOldInvoice(inv)} className="mt-1 text-xs flex items-center gap-1 bg-[#EAA300] text-black px-3 py-1 rounded font-bold hover:bg-yellow-500">
                                <Download size={14} /> Download
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* === TAB: INVOICE GENERATOR === */}
        {activeTab === 'invoice' && (
          <>
            {/* LEFT: EDIT PANEL */}
            <div className="w-[35%] bg-white rounded shadow-lg flex flex-col h-full overflow-hidden border-t-4 border-[#0B2447] no-print">
              <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                <h2 className="font-bold text-[#0B2447]">Invoice Details</h2>
                <button onClick={handleSaveInvoice} className="flex items-center gap-1 bg-green-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-green-700 shadow-lg">
                  <Save size={16} /> SAVE BILL
                </button>
              </div>

              <div className="p-4 overflow-y-auto flex-1 space-y-4 text-xs">
                <div className="bg-blue-50 p-3 rounded border border-blue-200">
                  <label className="font-bold text-gray-500 uppercase block mb-1">Select Customer</label>
                  <select className="w-full border p-2 rounded bg-white" onChange={(e) => handleCustomerSelect(e.target.value)} value={formData.customerId}>
                    <option value="">-- Choose --</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div><label className="font-bold">Inv No (Auto)</label><input className="w-full border p-1 rounded bg-gray-100" value={formData.invNo} readOnly /></div>
                  <div><label className="font-bold">Date</label><input type="date" className="w-full border p-1 rounded" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} /></div>
                  <div><label className="font-bold">Vehicle No</label><input className="w-full border p-1 rounded" value={formData.vehicleNo} onChange={e => setFormData({ ...formData, vehicleNo: e.target.value })} /></div>
                  <div><label className="font-bold">Destination</label><input className="w-full border p-1 rounded" value={formData.destination} onChange={e => setFormData({ ...formData, destination: e.target.value })} /></div>
                </div>

                <div className="border p-2 rounded">
                  <label className="font-bold text-blue-900 block mb-1">Billing Address (Editable)</label>
                  <textarea rows={3} className="w-full border p-1 rounded mb-2" value={formData.cAddress} onChange={e => setFormData({ ...formData, cAddress: e.target.value })} />
                </div>

                <div>
                  <label className="font-bold text-gray-500 uppercase block mb-2">Items</label>
                  {cart.map((item, idx) => (
                    <div key={item.id} className="flex gap-1 mb-2">
                      <select className="w-[45%] border p-1 rounded" value={item.productId} onChange={(e) => {
                        const p = products.find(x => x.id.toString() === e.target.value);
                        if (p) { const n = [...cart]; n[idx] = { ...n[idx], productId: e.target.value, name: p.name, hsn: p.hsn, unit: p.unit, rate: p.rate }; setCart(n); }
                      }}>
                        <option value="">Item...</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      <input type="number" placeholder="Qty" className="w-[20%] border p-1 rounded" value={item.qty} onChange={e => { const n = [...cart]; n[idx].qty = Number(e.target.value); setCart(n) }} />
                      <input type="number" placeholder="Rate" className="w-[25%] border p-1 rounded bg-yellow-50" value={item.rate} onChange={e => { const n = [...cart]; n[idx].rate = Number(e.target.value); setCart(n) }} />
                      <button onClick={() => setCart(cart.filter(x => x.id !== item.id))} className="text-red-500"><Trash2 size={14} /></button>
                    </div>
                  ))}
                  <button onClick={() => setCart([...cart, { id: Date.now(), productId: "", name: "", hsn: "", unit: "Kgs", qty: 0, rate: 0 }])} className="w-full py-1 bg-gray-100 font-bold border rounded hover:bg-gray-200">+ Add Row</button>
                </div>
              </div>
            </div>

            {/* RIGHT: PDF PREVIEW */}
            <div className="flex-1 bg-gray-500 p-8 overflow-y-auto flex justify-center items-start">
              <div
                id="invoice-area"
                className="bg-white text-black shadow-2xl"
                style={{ width: '210mm', minHeight: '297mm', padding: '10mm', fontFamily: '"Times New Roman", Times, serif', fontSize: '11px', lineHeight: '1.2' }}
              >
                <div style={{ textAlign: 'center', marginBottom: '5px' }}>
                  <div style={{ textAlign: 'left', fontWeight: 'bold', fontSize: '10px' }}>GSTIN:{COMPANY_DETAILS.gstin}</div>
                  <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: '5px 0' }}>{COMPANY_DETAILS.name}</h1>
                  <div>{COMPANY_DETAILS.desc}</div>
                  <div style={{ fontSize: '10px' }}>{COMPANY_DETAILS.address}</div>
                  <div style={{ fontSize: '10px' }}>{COMPANY_DETAILS.contact}</div>
                  <div style={{ borderTop: '1px solid black', borderBottom: '1px solid black', margin: '5px 0', padding: '2px', fontWeight: 'bold', textAlign: 'center' }}>TAX INVOICE</div>
                </div>
                <div style={{ display: 'flex', border: '1px solid black' }}>
                  <div style={{ width: '50%', borderRight: '1px solid black' }}>
                    <div style={{ padding: '4px', height: '130px', borderBottom: '1px solid black' }}>
                      <div style={{ fontWeight: 'bold' }}>Consignee Address</div>
                      <div style={{ marginTop: '4px' }}>Name : {formData.cName}</div>
                      <div>Address : {formData.cAddress}</div>
                      <div>GSTIN/UIN : {formData.cGst}</div>
                      <div>State Name : {formData.cState}</div>
                      <div>State Code : {formData.cStateCode}</div>
                    </div>
                    <div style={{ padding: '4px', height: '130px' }}>
                      <div style={{ fontWeight: 'bold' }}>Consignee Delivery Address</div>
                      <div style={{ marginTop: '4px' }}>Name : {formData.dName}</div>
                      <div>Address : {formData.dAddress}</div>
                      <div>GSTIN/UIN : {formData.dGst}</div>
                      <div>State Name : {formData.dState}</div>
                      <div>State Code : {formData.dStateCode}</div>
                    </div>
                  </div>
                  <div style={{ width: '50%' }}>
                    <div style={{ display: 'flex', borderBottom: '1px solid black' }}>
                      <div style={{ width: '50%', padding: '4px', borderRight: '1px solid black' }}><strong>INVOICE NO.</strong><br />{formData.invNo}</div>
                      <div style={{ width: '50%', padding: '4px' }}><strong>DATE</strong><br />{formData.date}</div>
                    </div>
                    <div style={{ display: 'flex', borderBottom: '1px solid black' }}>
                      <div style={{ width: '50%', padding: '4px', borderRight: '1px solid black' }}><strong>DELIVERY NOTE</strong><br />{formData.deliveryNote}</div>
                      <div style={{ width: '50%', padding: '4px' }}><strong>MODE/TERMS OF PAYMENT</strong><br />{formData.paymentMode}</div>
                    </div>
                    <div style={{ display: 'flex', borderBottom: '1px solid black' }}>
                      <div style={{ width: '50%', padding: '4px', borderRight: '1px solid black' }}><strong>BUYER'S ORDER NO.</strong><br />{formData.buyersOrderNo}</div>
                      <div style={{ width: '50%', padding: '4px' }}><strong>DATE</strong><br /></div>
                    </div>
                    <div style={{ display: 'flex', borderBottom: '1px solid black' }}>
                      <div style={{ width: '50%', padding: '4px', borderRight: '1px solid black' }}><strong>DISPATCH DOC. NO.</strong><br />{formData.dispatchDocNo}</div>
                      <div style={{ width: '50%', padding: '4px' }}><strong>DESTINATION</strong><br />{formData.destination}</div>
                    </div>
                    <div style={{ padding: '4px', borderBottom: '1px solid black' }}>
                      <strong>DISPATCHED THROUGH</strong> <span style={{ marginLeft: '10px' }}>{formData.dispatchThrough}</span> <br />
                      <strong>MOTOR VEHICLE NO</strong> <span style={{ marginLeft: '10px' }}>{formData.vehicleNo}</span>
                    </div>
                    <div style={{ padding: '4px', height: '62px' }}><strong>TERMS OF DELIVERY :</strong> {formData.terms}</div>
                  </div>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid black', borderTop: 'none', fontSize: '11px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid black', textAlign: 'center' }}>
                      <th style={{ borderRight: '1px solid black', width: '30px', padding: '4px' }}>SL.NO.</th>
                      <th style={{ borderRight: '1px solid black', textAlign: 'left', padding: '4px' }}>DESCRIPTION OF GOODS/SERVICE</th>
                      <th style={{ borderRight: '1px solid black', width: '60px', padding: '4px' }}>HSN/SAC</th>
                      <th style={{ borderRight: '1px solid black', width: '70px', padding: '4px' }}>QUANTITY</th>
                      <th style={{ borderRight: '1px solid black', width: '60px', padding: '4px' }}>RATE</th>
                      <th style={{ borderRight: '1px solid black', width: '40px', padding: '4px' }}>UOM</th>
                      <th style={{ width: '90px', padding: '4px', textAlign: 'right' }}>AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item, i) => (
                      <tr key={i} style={{ verticalAlign: 'top' }}>
                        <td style={{ borderRight: '1px solid black', padding: '4px', textAlign: 'center' }}>{i + 1}</td>
                        <td style={{ borderRight: '1px solid black', padding: '4px', fontWeight: 'bold' }}>{item.name}</td>
                        <td style={{ borderRight: '1px solid black', padding: '4px', textAlign: 'center' }}>{item.hsn}</td>
                        <td style={{ borderRight: '1px solid black', padding: '4px', textAlign: 'center', fontWeight: 'bold' }}>{item.qty} {item.unit}</td>
                        <td style={{ borderRight: '1px solid black', padding: '4px', textAlign: 'right' }}>{item.rate.toFixed(2)}</td>
                        <td style={{ borderRight: '1px solid black', padding: '4px', textAlign: 'center' }}>{item.unit}</td>
                        <td style={{ padding: '4px', textAlign: 'right', fontWeight: 'bold' }}>{(item.qty * item.rate).toFixed(2)}</td>
                      </tr>
                    ))}
                    {Array.from({ length: Math.max(0, 15 - cart.length) }).map((_, i) => (
                      <tr key={`e-${i}`} style={{ height: '20px' }}>
                        <td style={{ borderRight: '1px solid black' }}></td><td style={{ borderRight: '1px solid black' }}></td><td style={{ borderRight: '1px solid black' }}></td><td style={{ borderRight: '1px solid black' }}></td><td style={{ borderRight: '1px solid black' }}></td><td style={{ borderRight: '1px solid black' }}></td><td></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ border: '1px solid black', borderTop: 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', borderBottom: '1px solid black' }}>
                    <div style={{ width: '100px', borderLeft: '1px solid black', textAlign: 'center', padding: '2px', fontWeight: 'bold' }}>TOTAL</div>
                    <div style={{ width: '30px', borderLeft: '1px solid black', textAlign: 'center', padding: '2px' }}>=</div>
                    <div style={{ width: '90px', borderLeft: '1px solid black', textAlign: 'right', padding: '2px', paddingRight: '4px', fontWeight: 'bold' }}>{subtotal.toFixed(2)}</div>
                  </div>
                  {isInterState ? (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', borderBottom: '1px solid black' }}>
                      <div style={{ width: '100px', borderLeft: '1px solid black', textAlign: 'center', padding: '2px', fontWeight: 'bold' }}>IGST</div>
                      <div style={{ width: '30px', borderLeft: '1px solid black', textAlign: 'center', padding: '2px' }}>18%</div>
                      <div style={{ width: '90px', borderLeft: '1px solid black', textAlign: 'right', padding: '2px', paddingRight: '4px' }}>{taxAmount.toFixed(2)}</div>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', borderBottom: '1px solid black' }}>
                        <div style={{ width: '100px', borderLeft: '1px solid black', textAlign: 'center', padding: '2px', fontWeight: 'bold' }}>CGST</div>
                        <div style={{ width: '30px', borderLeft: '1px solid black', textAlign: 'center', padding: '2px' }}>9%</div>
                        <div style={{ width: '90px', borderLeft: '1px solid black', textAlign: 'right', padding: '2px', paddingRight: '4px' }}>{(taxAmount / 2).toFixed(2)}</div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', borderBottom: '1px solid black' }}>
                        <div style={{ width: '100px', borderLeft: '1px solid black', textAlign: 'center', padding: '2px', fontWeight: 'bold' }}>SGST</div>
                        <div style={{ width: '30px', borderLeft: '1px solid black', textAlign: 'center', padding: '2px' }}>9%</div>
                        <div style={{ width: '90px', borderLeft: '1px solid black', textAlign: 'right', padding: '2px', paddingRight: '4px' }}>{(taxAmount / 2).toFixed(2)}</div>
                      </div>
                    </>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', borderBottom: '1px solid black' }}>
                    <div style={{ flex: 1, padding: '2px 10px', textAlign: 'right', fontWeight: 'bold' }}>GRAND TOTAL INVOICE AMOUNT :</div>
                    <div style={{ width: '70px', borderLeft: '1px solid black', textAlign: 'center', padding: '2px', fontWeight: 'bold' }}>{totalQty} Kgs</div>
                    <div style={{ width: '90px', borderLeft: '1px solid black', textAlign: 'right', padding: '2px', paddingRight: '4px', fontWeight: 'bold' }}>{grandTotal.toFixed(2)}</div>
                  </div>
                </div>
                <div style={{ border: '1px solid black', borderTop: 'none', padding: '4px' }}>
                  <div style={{ fontWeight: 'bold' }}>GRAND TOTAL INVOICE AMOUNT (IN WORDS)</div>
                  <div style={{ fontWeight: 'bold', fontStyle: 'italic', marginTop: '2px' }}>{numberToWords(grandTotal)}</div>
                </div>
                <div style={{ display: 'flex', border: '1px solid black', borderTop: 'none', textAlign: 'center', fontSize: '10px' }}>
                  <div style={{ width: '50%', borderRight: '1px solid black', padding: '2px' }}>
                    <div style={{ display: 'flex', borderBottom: '1px solid black' }}><div style={{ width: '50%', borderRight: '1px solid black' }}>HSN/SAC</div><div style={{ width: '50%' }}>TAXABLE VALUE</div></div>
                    <div style={{ display: 'flex', fontWeight: 'bold' }}><div style={{ width: '50%', borderRight: '1px solid black' }}>7308</div><div style={{ width: '50%' }}>{subtotal.toFixed(2)}</div></div>
                  </div>
                  <div style={{ width: '50%', padding: '2px' }}>
                    <div style={{ borderBottom: '1px solid black' }}>TAX AMOUNT</div>
                    <div style={{ fontWeight: 'bold' }}>{taxAmount.toFixed(2)}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', border: '1px solid black', borderTop: 'none', height: '120px' }}>
                  <div style={{ width: '50%', borderRight: '1px solid black', padding: '4px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div>DECLARATION</div><div>We declare that all particulars in this invoice are true and correct</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 'bold', textDecoration: 'underline' }}>Company's Bank Details</div>
                      <div style={{ fontWeight: 'bold' }}>NAME : {COMPANY_DETAILS.name}</div>
                      <div style={{ fontWeight: 'bold' }}>A/C NO: {COMPANY_DETAILS.accNo}</div>
                      <div style={{ fontWeight: 'bold' }}>BANK : {COMPANY_DETAILS.bankName}</div>
                      <div style={{ fontWeight: 'bold' }}>BRANCH : {COMPANY_DETAILS.branch}</div>
                      <div style={{ fontWeight: 'bold' }}>IFSC CODE : {COMPANY_DETAILS.ifsc}</div>
                    </div>
                  </div>
                  <div style={{ width: '50%', padding: '4px', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '5px', right: '5px', fontWeight: 'bold' }}>AUTHORISED SIGNATORY</div>
                    <div style={{ position: 'absolute', bottom: '5px', right: '5px', fontWeight: 'bold' }}>THIS IS A COMPUTER GENERATED INVOICE</div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}