"use client";
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { useAuth } from '@/lib/AuthContext';
import { 
  Partner, 
  PartnerProduct, 
  PartnerOrder, 
  OrderStatus, 
  PartnerCategory,
  PartnerReviewStatus,
  PartnerVerificationStatus,
  ProductVariant,
  PartnerAnalyticsEvent
} from '@/lib/partners/types';
import { 
  getPartners, 
  getPartnerProductsByPartnerId, 
  getPartnerOrders, 
  updateOrderStatus, 
  createPartnerProductListing,
  updatePartnerProductListing,
  archivePartnerProductListing,
  bulkCreatePartnerProducts 
} from '@/lib/partners/partnerService';
import { 
  validatePurchaseUrl, 
  calculateDiscountPercent, 
  validateCsvRow 
} from '@/lib/partners/partnerValidation';
import { 
  trackPartnerEvent, 
  computePartnerAnalytics, 
  generatePartnerAnalyticsCsv,
  getPartnerAnalyticsEvents
} from '@/lib/partners/partnerAnalytics';
import {
  uploadPartnerProductImage,
  validatePartnerImageFile
} from '@/lib/partners/partnerStorage';

export default function PartnerCommercePortal() {
  const { user, userProfile, isAdmin } = useAuth();
  const [mounted, setMounted] = useState(false);

  // Navigation State
  const [activeTab, setActiveTab] = useState<
    'overview' | 'products' | 'add_product' | 'bulk_upload' | 'analytics' | 'orders' | 'profile' | 'settings'
  >('overview');

  // Partner selection / multi-tenant scoping
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('partner_silkcraft');
  const [products, setProducts] = useState<PartnerProduct[]>([]);
  const [orders, setOrders] = useState<PartnerOrder[]>([]);
  const [analyticsEvents, setAnalyticsEvents] = useState<PartnerAnalyticsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [dateRange, setDateRange] = useState<'today' | '7d' | '30d' | '90d' | 'all'>('30d');

  // Form State for Add / Edit Product
  const [editingProduct, setEditingProduct] = useState<PartnerProduct | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState<PartnerCategory>('Fashion');
  const [formSubcategory, setFormSubcategory] = useState('');
  const [formBrand, setFormBrand] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formMrp, setFormMrp] = useState<number>(2999);
  const [formSellingPrice, setFormSellingPrice] = useState<number>(1799);
  const [formStock, setFormStock] = useState<number>(25);
  const [formShippingCharges, setFormShippingCharges] = useState<number>(0);
  const [formPurchaseUrl, setFormPurchaseUrl] = useState('');
  const [formImages, setFormImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80'
  ]);
  const [formPrimaryImage, setFormPrimaryImage] = useState<string>(
    'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80'
  );
  const [formGarmentCat, setFormGarmentCat] = useState<'saree' | 'dresses' | 'upper_body' | 'lower_body' | 'accessories'>('saree');
  const [formTryOn, setFormTryOn] = useState(true);
  const [formVariants, setFormVariants] = useState<ProductVariant[]>([]);
  const [formFormErrors, setFormErrors] = useState<string[]>([]);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bulk Upload State
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvParsedRows, setCsvParsedRows] = useState<Partial<PartnerProduct>[]>([]);
  const [csvRowErrors, setCsvRowErrors] = useState<string[]>([]);
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvImportResult, setCsvImportResult] = useState<{ created: number; failed: number } | null>(null);

  // Orders Fulfillment Modal State
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState<PartnerOrder | null>(null);
  const [newOrderStatus, setNewOrderStatus] = useState<OrderStatus>('PACKING');
  const [courierCarrier, setCourierCarrier] = useState('BlueDart Express');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [statusNote, setStatusNote] = useState('');

  // Return Inspection Modal State
  const [selectedOrderForInspection, setSelectedOrderForInspection] = useState<PartnerOrder | null>(null);
  const [inspectionCondition, setInspectionCondition] = useState<'RESTOCKABLE' | 'DAMAGED' | 'DEFECTIVE' | 'UNSELLABLE'>('RESTOCKABLE');
  const [inspectionNotes, setInspectionNotes] = useState('');

  // Product Preview Modal State
  const [previewProduct, setPreviewProduct] = useState<PartnerProduct | null>(null);

  // Active Partner Data
  const currentPartner = useMemo(() => {
    return partners.find(p => p.id === selectedPartnerId) || partners[0];
  }, [partners, selectedPartnerId]);

  // Initial Load
  useEffect(() => {
    setMounted(true);
    async function loadData() {
      setLoading(true);
      const allPartners = await getPartners();
      setPartners(allPartners);
      if (allPartners.length > 0) {
        setSelectedPartnerId(allPartners[0].id);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  // Fetch Partner Products & Orders when Partner changes
  const refreshPartnerData = async (partnerId: string) => {
    if (!partnerId) return;
    const [partnerProds, partnerOrds, partnerEvents] = await Promise.all([
      getPartnerProductsByPartnerId(partnerId),
      getPartnerOrders(partnerId),
      getPartnerAnalyticsEvents(partnerId)
    ]);
    setProducts(partnerProds);
    setOrders(partnerOrds);
    setAnalyticsEvents(partnerEvents);
  };

  useEffect(() => {
    if (selectedPartnerId) {
      refreshPartnerData(selectedPartnerId);
    }
  }, [selectedPartnerId]);

  // Form Reset
  const resetProductForm = () => {
    setEditingProduct(null);
    setFormTitle('');
    setFormDescription('');
    setFormCategory('Fashion');
    setFormSubcategory('');
    setFormBrand(currentPartner?.brandName || '');
    setFormSku('');
    setFormMrp(2999);
    setFormSellingPrice(1799);
    setFormStock(25);
    setFormShippingCharges(0);
    setFormPurchaseUrl('');
    setFormImages(['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80']);
    setFormPrimaryImage('https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80');
    setFormGarmentCat('saree');
    setFormTryOn(true);
    setFormVariants([]);
    setFormErrors([]);
  };

  // Populate Form for Editing
  const handleStartEdit = (prod: PartnerProduct) => {
    setEditingProduct(prod);
    setFormTitle(prod.title);
    setFormDescription(prod.description);
    setFormCategory(prod.category);
    setFormSubcategory(prod.subcategory || '');
    setFormBrand(prod.brand);
    setFormSku(prod.sku);
    setFormMrp(prod.mrp);
    setFormSellingPrice(prod.sellingPrice);
    setFormStock(prod.stock);
    setFormShippingCharges(prod.shippingCharges || 0);
    setFormPurchaseUrl(prod.productUrl || '');
    setFormImages(prod.images || [prod.primaryImage]);
    setFormPrimaryImage(prod.primaryImage);
    setFormGarmentCat(prod.garmentCategory || 'saree');
    setFormTryOn(prod.tryOnEnabled);
    setFormVariants(prod.variants || []);
    setFormErrors([]);
    setActiveTab('add_product');
  };

  // Binary Image Upload Handler (Validates file & uploads binary blob to Firebase Storage)
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setImageUploadError(null);

    // Validate size (<5MB), MIME type, and extension
    const validation = validatePartnerImageFile(file);
    if (!validation.valid) {
      const err = validation.error || 'Invalid file format or size.';
      setImageUploadError(err);
      alert(err);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploadingImage(true);
    setUploadProgress(0);

    try {
      // Use current partner ID derived from authorized partner selection
      const targetPartnerId = currentPartner?.id || 'partner_silkcraft';
      const result = await uploadPartnerProductImage(file, targetPartnerId, {
        onProgress: (pct) => setUploadProgress(pct)
      });

      if (!result.success || !result.downloadUrl) {
        const errMsg = result.error || 'Failed to upload image to Firebase Storage.';
        setImageUploadError(errMsg);
        alert(errMsg);
      } else {
        const uploadedUrl = result.downloadUrl;
        setFormImages(prev => [uploadedUrl, ...prev.filter(img => img !== uploadedUrl)]);
        setFormPrimaryImage(uploadedUrl);
      }
    } catch (err: any) {
      const msg = err.message || 'Unexpected upload error.';
      setImageUploadError(msg);
      alert(msg);
    } finally {
      setUploadingImage(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (imgToRemove: string) => {
    setFormImages(prev => {
      const remaining = prev.filter(img => img !== imgToRemove);
      if (formPrimaryImage === imgToRemove) {
        setFormPrimaryImage(remaining[0] || '');
      }
      return remaining;
    });
  };

  // Submit Add / Edit Product
  const handleSaveProduct = async (isDraft: boolean = false) => {
    if (!currentPartner) return;
    setFormSubmitting(true);
    setFormErrors([]);

    const discount = calculateDiscountPercent(formMrp, formSellingPrice);

    if (editingProduct) {
      // Update existing listing
      const res = await updatePartnerProductListing(
        editingProduct.id,
        currentPartner.id,
        {
          title: formTitle,
          description: formDescription,
          category: formCategory,
          subcategory: formSubcategory,
          brand: formBrand,
          sku: formSku,
          mrp: formMrp,
          sellingPrice: formSellingPrice,
          stock: formStock,
          shippingCharges: formShippingCharges,
          productUrl: formPurchaseUrl,
          images: formImages,
          primaryImage: formPrimaryImage,
          garmentCategory: formGarmentCat,
          tryOnEnabled: formTryOn,
          variants: formVariants
        },
        isAdmin
      );

      if (!res.success) {
        setFormErrors(res.errors || ['Failed to update listing.']);
        setFormSubmitting(false);
        return;
      }

      await trackPartnerEvent({
        partnerId: currentPartner.id,
        productId: editingProduct.id,
        eventType: 'partner_product_updated',
        metadata: { title: formTitle, discount }
      });

      alert('Listing updated successfully. If price or URL changed, listing was queued for re-verification.');
    } else {
      // Create new listing
      const res = await createPartnerProductListing({
        partnerId: currentPartner.id,
        partnerName: currentPartner.brandName,
        title: formTitle,
        description: formDescription,
        category: formCategory,
        subcategory: formSubcategory,
        brand: formBrand || currentPartner.brandName,
        sku: formSku || `SKU-${Date.now()}`,
        mrp: formMrp,
        sellingPrice: formSellingPrice,
        stock: formStock,
        shippingCharges: formShippingCharges,
        productUrl: formPurchaseUrl,
        images: formImages,
        primaryImage: formPrimaryImage,
        garmentCategory: formGarmentCat,
        tryOnEnabled: formTryOn,
        variants: formVariants,
        isDraft
      });

      if (!res.success || !res.product) {
        setFormErrors(res.errors || ['Failed to create product listing.']);
        setFormSubmitting(false);
        return;
      }

      await trackPartnerEvent({
        partnerId: currentPartner.id,
        productId: res.product.id,
        eventType: isDraft ? 'partner_product_created' : 'partner_product_submitted',
        metadata: { title: formTitle, isDraft }
      });

      alert(isDraft ? 'Product saved as Draft.' : 'Product submitted for BuyWise Review and Price Verification!');
    }

    setFormSubmitting(false);
    resetProductForm();
    await refreshPartnerData(currentPartner.id);
    setActiveTab('products');
  };

  // Archive Listing
  const handleArchive = async (productId: string) => {
    if (!currentPartner) return;
    if (!confirm('Are you sure you want to archive this product listing?')) return;
    await archivePartnerProductListing(productId, currentPartner.id, isAdmin);
    await refreshPartnerData(currentPartner.id);
    alert('Product listing archived.');
  };

  // CSV Template Download
  const handleDownloadCsvTemplate = () => {
    const templateContent = [
      'Title,Category,Brand,SKU,Description,Price,MRP,Stock,Shipping,Image URL,Buy Link',
      '"Pure Silk Kanjivaram Saree","Fashion","SilkCraft","SKU-SILK-001","Handwoven authentic Kanjivaram silk saree with gold zari border.",3499,6999,25,0,"https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800","https://example.com/products/kanjivaram"',
      '"Wireless ANC Earbuds Pro","Audio & Headphones","SoundPulse","SKU-AUDIO-002","Active noise cancelling bluetooth 5.3 earbuds with 36hr battery.",1899,4999,50,50,"https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800","https://example.com/products/earbuds"'
    ].join('\n');

    const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'buywise_partner_products_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV File Upload & Parse
  const handleCsvFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);
    setCsvImportResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length < 2) {
        setCsvRowErrors(['CSV file must contain a header row and at least one data row.']);
        return;
      }

      // Basic CSV tokenizer supporting quoted fields
      const parseCsvLine = (line: string): string[] => {
        const result: string[] = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(cur.trim());
            cur = '';
          } else {
            cur += char;
          }
        }
        result.push(cur.trim());
        return result;
      };

      const headers = parseCsvLine(lines[0]);
      const validRows: Partial<PartnerProduct>[] = [];
      const errors: string[] = [];
      const seenSkus = new Set<string>();

      for (let i = 1; i < lines.length; i++) {
        const cols = parseCsvLine(lines[i]);
        const rowObj: Record<string, string> = {};
        headers.forEach((h, idx) => {
          rowObj[h] = cols[idx] || '';
        });

        const validation = validateCsvRow(rowObj, i);
        if (!validation.valid || !validation.product) {
          errors.push(...validation.errors);
        } else {
          // Check duplicate SKUs in file
          if (validation.product.sku && seenSkus.has(validation.product.sku)) {
            errors.push(`Row ${i}: Duplicate SKU "${validation.product.sku}" found in file.`);
          } else {
            if (validation.product.sku) seenSkus.add(validation.product.sku);
            validRows.push(validation.product);
          }
        }
      }

      setCsvParsedRows(validRows);
      setCsvRowErrors(errors);
    };
    reader.readAsText(file);
  };

  // Execute Bulk Import
  const handleExecuteBulkImport = async () => {
    if (!currentPartner || csvParsedRows.length === 0) return;
    setCsvImporting(true);

    const result = await bulkCreatePartnerProducts(
      currentPartner.id,
      currentPartner.brandName,
      csvParsedRows
    );

    setCsvImportResult(result);
    setCsvImporting(false);
    await refreshPartnerData(currentPartner.id);

    await trackPartnerEvent({
      partnerId: currentPartner.id,
      eventType: 'partner_product_submitted',
      metadata: { bulkCount: result.created }
    });

    alert(`Bulk Import Complete: ${result.created} products submitted to Review Queue, ${result.failed} failed.`);
  };

  // Analytics Computation from Real Ingested Events
  const analyticsSummary = useMemo(() => {
    return computePartnerAnalytics({
      partnerId: currentPartner?.id || 'partner',
      dateRange,
      events: analyticsEvents,
      products,
      orders
    });
  }, [currentPartner, dateRange, analyticsEvents, products, orders]);

  // Export Analytics CSV
  const handleExportAnalyticsCsv = () => {
    if (!currentPartner) return;
    const csv = generatePartnerAnalyticsCsv(analyticsSummary, products);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `buywise_analytics_${currentPartner.id}_${dateRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Products for Catalog Table
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'LIVE' && p.status !== 'LIVE') return false;
        if (statusFilter === 'PENDING' && p.reviewStatus !== 'PENDING_REVIEW' && p.status !== 'PENDING_APPROVAL') return false;
        if (statusFilter === 'REJECTED' && p.reviewStatus !== 'REJECTED') return false;
        if (statusFilter === 'ARCHIVED' && p.status !== 'ARCHIVED') return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = p.title.toLowerCase().includes(query);
        const matchSku = (p.sku || '').toLowerCase().includes(query);
        const matchCat = p.category.toLowerCase().includes(query);
        return matchTitle || matchSku || matchCat;
      }
      return true;
    });
  }, [products, statusFilter, searchQuery]);

  // KPIs
  const totalProductsCount = products.length;
  const activeProductsCount = products.filter(p => p.status === 'LIVE').length;
  const pendingReviewCount = products.filter(p => p.reviewStatus === 'PENDING_REVIEW' || p.status === 'PENDING_APPROVAL').length;
  const rejectedCount = products.filter(p => p.reviewStatus === 'REJECTED').length;
  const outOfStockCount = products.filter(p => p.stock <= 0).length;

  return (
    <main style={{ minHeight: '100vh', background: '#070512', color: 'white', paddingBottom: '90px' }}>
      <style jsx>{`
        .portal-header {
          background: rgba(13, 10, 26, 0.95);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--glass-border);
          padding: 16px 28px;
          display: flex;
          justifyContent: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          position: sticky;
          top: 0;
          z-index: 50;
        }
        .portal-brand-block {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
        }
        .portal-switcher-box {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(255, 255, 255, 0.04);
          padding: 8px 14px;
          border-radius: 16px;
          border: 1px solid var(--glass-border);
        }
        .portal-switcher-label {
          font-size: 12px;
          color: var(--text-secondary);
          white-space: nowrap;
          flex-shrink: 0;
          font-weight: 800;
          letter-spacing: 0.02em;
        }
        .portal-switcher-select {
          padding: 8px 14px;
          border-radius: 12px;
          background: rgba(14, 10, 34, 0.92);
          border: 1.5px solid rgba(0, 212, 255, 0.35);
          color: white;
          font-weight: 800;
          font-size: 13px;
          outline: none;
          cursor: pointer;
          max-width: 280px;
        }
        .portal-tab-bar {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          border-bottom: 1px solid var(--glass-border);
          padding-bottom: 12px;
        }
        .portal-tab-bar::-webkit-scrollbar {
          display: none;
        }
        .portal-tab-btn {
          flex-shrink: 0;
          white-space: nowrap;
          padding: 10px 20px;
          border-radius: 14px;
          font-weight: 800;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @media (max-width: 768px) {
          .portal-header {
            padding: 12px 16px;
            gap: 12px;
          }
          .portal-brand-block {
            width: 100%;
          }
          .portal-switcher-box {
            width: 100%;
            justify-content: space-between;
          }
          .portal-switcher-select {
            flex: 1;
            max-width: 100%;
          }
          .portal-tab-btn {
            padding: 8px 14px;
            font-size: 12px;
          }
        }
      `}</style>
      
      {/* Top Header Bar */}
      <header className="portal-header">
        <div className="portal-brand-block">
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #00d4ff, #7928ca)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            boxShadow: '0 0 20px rgba(0, 212, 255, 0.3)',
            flexShrink: 0
          }}>
            🏢
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#00ff88', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
                BUYWISE PARTNER COMMERCE PORTAL
              </span>
              <span style={{ fontSize: '10px', background: 'rgba(0, 255, 136, 0.15)', color: '#00ff88', padding: '2px 8px', borderRadius: '8px', border: '1px solid rgba(0,255,136,0.3)', whiteSpace: 'nowrap' }}>
                VERIFIED ECOSYSTEM
              </span>
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: 900, margin: '4px 0 0 0', display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <span>{currentPartner?.brandName || 'Merchant Store'}</span>
              <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                ({currentPartner?.companyName})
              </span>
            </h1>
          </div>
        </div>

        {/* Multi-Merchant Store Switcher */}
        <div className="portal-switcher-box">
          <span className="portal-switcher-label">Active Store:</span>
          <select
            value={selectedPartnerId}
            onChange={(e) => setSelectedPartnerId(e.target.value)}
            className="portal-switcher-select"
          >
            {partners.map(p => (
              <option key={p.id} value={p.id} style={{ background: '#0e0a22', color: 'white' }}>
                {p.brandName} — {p.category}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Main Navigation Subheader */}
      <section className="container" style={{ paddingTop: '20px', paddingBottom: '16px' }}>
        <div className="portal-tab-bar">
          {[
            { id: 'overview', label: '📊 Overview' },
            { id: 'products', label: `📦 Products (${totalProductsCount})` },
            { id: 'add_product', label: editingProduct ? '✏️ Edit Product' : '➕ Add Product' },
            { id: 'bulk_upload', label: '📁 Bulk CSV Upload' },
            { id: 'analytics', label: '📈 Analytics & Reports' },
            { id: 'orders', label: `🚚 Orders & Tracking (${orders.length})` },
            { id: 'profile', label: '🏪 Store Profile' },
            { id: 'settings', label: '⚙️ Settings' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === 'add_product' && !editingProduct) resetProductForm();
                setActiveTab(tab.id as any);
              }}
              className="portal-tab-btn"
              style={{
                border: activeTab === tab.id ? '1px solid rgba(0, 212, 255, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                background: activeTab === tab.id ? 'linear-gradient(135deg, #a855f7, #00d4ff)' : 'rgba(255, 255, 255, 0.03)',
                color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
                boxShadow: activeTab === tab.id ? '0 4px 16px rgba(0, 212, 255, 0.3)' : 'none'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {/* Content Container */}
      <section className="container">
        {(!mounted || loading) ? (
          <div style={{ padding: '80px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚡</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff' }}>Loading BuyWise Partner Commerce Workspace...</div>
          </div>
        ) : (
          <>
            {/* ============================================================== */}
            {/* 1. OVERVIEW TAB */}
            {/* ============================================================== */}
            {activeTab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Top KPI Cards Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '16px'
                }}>
                  {/* Total Products */}
                  <div className="glass" style={{ padding: '20px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 700 }}>Total Catalog</div>
                    <div style={{ fontSize: '28px', fontWeight: 900, marginTop: '8px' }}>{totalProductsCount}</div>
                    <div style={{ fontSize: '11px', color: '#00d4ff', marginTop: '4px' }}>Listings registered</div>
                  </div>

                  {/* Active Products */}
                  <div className="glass" style={{ padding: '20px', borderRadius: '16px', border: '1px solid rgba(0, 255, 136, 0.3)' }}>
                    <div style={{ fontSize: '12px', color: '#00ff88', fontWeight: 700 }}>Active & Live</div>
                    <div style={{ fontSize: '28px', fontWeight: 900, marginTop: '8px', color: '#00ff88' }}>{activeProductsCount}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>Eligible for comparison</div>
                  </div>

                  {/* Pending Review */}
                  <div className="glass" style={{ padding: '20px', borderRadius: '16px', border: '1px solid rgba(255, 215, 0, 0.3)' }}>
                    <div style={{ fontSize: '12px', color: '#ffd700', fontWeight: 700 }}>Pending Review</div>
                    <div style={{ fontSize: '28px', fontWeight: 900, marginTop: '8px', color: '#ffd700' }}>{pendingReviewCount}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>In BuyWise review queue</div>
                  </div>

                  {/* Rejected */}
                  <div className="glass" style={{ padding: '20px', borderRadius: '16px', border: '1px solid rgba(255, 68, 68, 0.3)' }}>
                    <div style={{ fontSize: '12px', color: '#ff4444', fontWeight: 700 }}>Action Required</div>
                    <div style={{ fontSize: '28px', fontWeight: 900, marginTop: '8px', color: '#ff4444' }}>{rejectedCount}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>Rejected or suspended</div>
                  </div>

                  {/* Out of Stock */}
                  <div className="glass" style={{ padding: '20px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 700 }}>Out of Stock</div>
                    <div style={{ fontSize: '28px', fontWeight: 900, marginTop: '8px' }}>{outOfStockCount}</div>
                    <div style={{ fontSize: '11px', color: '#ffd700', marginTop: '4px' }}>Stock = 0 units</div>
                  </div>
                </div>

                {/* Performance & Revenue Ledger Cards */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '16px'
                }}>
                  <div className="glass" style={{ padding: '24px', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-secondary)' }}>ATTRIBUTED ORDERS</span>
                      <span style={{ fontSize: '11px', color: '#00ff88', fontWeight: 700 }}>VERIFIED REAL ORDERS</span>
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: 900, marginTop: '12px', color: '#00d4ff' }}>
                      {orders.length}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                      Total partner-fulfilled orders registered in BuyWise platform ledger.
                    </div>
                  </div>

                  <div className="glass" style={{ padding: '24px', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-secondary)' }}>GROSS SALES VOLUME</span>
                      <span style={{ fontSize: '11px', color: '#00ff88', fontWeight: 700 }}>ACTUAL REVENUE</span>
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: 900, marginTop: '12px', color: '#00ff88' }}>
                      ₹{orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0).toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                      Total customer paid amount across all fulfilled partner items.
                    </div>
                  </div>

                  <div className="glass" style={{ padding: '24px', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-secondary)' }}>NET PAYABLE BALANCE</span>
                      <span style={{ fontSize: '11px', color: '#ffd700', fontWeight: 700 }}>AFTER COMMISSION</span>
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: 900, marginTop: '12px', color: '#ffd700' }}>
                      ₹{Math.max(0, orders.reduce((sum, o) => sum + (o.totalAmount || 0) - (o.buywiseCommission || 0), 0)).toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                      Net payout scheduled to registered bank account.
                    </div>
                  </div>
                </div>

                {/* Quick Actions & Recent Catalog Table */}
                <div className="glass" style={{ padding: '24px', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 900, margin: 0 }}>Recent Product Listings</h3>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => { resetProductForm(); setActiveTab('add_product'); }}
                        style={{ padding: '8px 16px', borderRadius: '10px', background: 'var(--gradient-accent)', color: 'white', border: 'none', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}
                      >
                        + Add Product
                      </button>
                      <button
                        onClick={() => setActiveTab('bulk_upload')}
                        style={{ padding: '8px 16px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.08)', color: 'white', border: '1px solid var(--glass-border)', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}
                      >
                        Bulk Upload
                      </button>
                    </div>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                          <th style={{ padding: '12px 8px' }}>Product</th>
                          <th style={{ padding: '12px 8px' }}>Category</th>
                          <th style={{ padding: '12px 8px' }}>Price</th>
                          <th style={{ padding: '12px 8px' }}>Stock</th>
                          <th style={{ padding: '12px 8px' }}>Review Status</th>
                          <th style={{ padding: '12px 8px' }}>Price Verification</th>
                          <th style={{ padding: '12px 8px', textAlign: 'right' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.slice(0, 5).map(prod => (
                          <tr key={prod.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <td style={{ padding: '12px 8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <img
                                src={prod.primaryImage}
                                alt={prod.title}
                                style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }}
                              />
                              <div>
                                <div style={{ fontWeight: 800 }}>{prod.title}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>SKU: {prod.sku}</div>
                              </div>
                            </td>
                            <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>{prod.category}</td>
                            <td style={{ padding: '12px 8px', fontWeight: 800 }}>
                              ₹{prod.sellingPrice.toLocaleString('en-IN')}
                              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textDecoration: 'line-through', marginLeft: '6px' }}>
                                ₹{prod.mrp.toLocaleString('en-IN')}
                              </span>
                            </td>
                            <td style={{ padding: '12px 8px' }}>
                              <span style={{ color: prod.stock > 0 ? '#00ff88' : '#ff4444', fontWeight: 800 }}>
                                {prod.stock > 0 ? `${prod.stock} units` : 'Out of stock'}
                              </span>
                            </td>
                            <td style={{ padding: '12px 8px' }}>
                              <span style={{
                                fontSize: '11px',
                                fontWeight: 800,
                                padding: '3px 8px',
                                borderRadius: '6px',
                                background: prod.reviewStatus === 'APPROVED' || prod.status === 'LIVE' ? 'rgba(0,255,136,0.15)' : prod.reviewStatus === 'REJECTED' ? 'rgba(255,68,68,0.15)' : 'rgba(255,215,0,0.15)',
                                color: prod.reviewStatus === 'APPROVED' || prod.status === 'LIVE' ? '#00ff88' : prod.reviewStatus === 'REJECTED' ? '#ff4444' : '#ffd700'
                              }}>
                                {prod.reviewStatus || (prod.status === 'LIVE' ? 'APPROVED' : 'PENDING_REVIEW')}
                              </span>
                            </td>
                            <td style={{ padding: '12px 8px' }}>
                              {prod.verificationStatus === 'verified_live' ? (
                                <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', background: 'rgba(0, 212, 255, 0.15)', color: '#00d4ff', border: '1px solid rgba(0, 212, 255, 0.3)' }}>
                                  🛡️ VERIFIED LIVE
                                </span>
                              ) : (
                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                  ⏳ Unverified
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                              <button
                                onClick={() => handleStartEdit(prod)}
                                style={{ padding: '6px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)', color: 'white', border: 'none', fontSize: '12px', fontWeight: 800, cursor: 'pointer', marginRight: '6px' }}
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* ============================================================== */}
            {/* 2. PRODUCTS CATALOG TAB */}
            {/* ============================================================== */}
            {activeTab === 'products' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Search & Filter Controls */}
                <div className="glass" style={{ padding: '16px 20px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '280px' }}>
                    <input
                      type="text"
                      placeholder="Search by title, SKU, or category..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        borderRadius: '10px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid var(--glass-border)',
                        color: 'white',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Status:</span>
                    {['ALL', 'LIVE', 'PENDING', 'REJECTED', 'ARCHIVED'].map(st => (
                      <button
                        key={st}
                        onClick={() => setStatusFilter(st)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: 'none',
                          background: statusFilter === st ? 'var(--gradient-accent)' : 'rgba(255, 255, 255, 0.05)',
                          color: statusFilter === st ? 'white' : 'var(--text-secondary)',
                          fontSize: '12px',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        {st}
                      </button>
                    ))}

                    <button
                      onClick={() => { resetProductForm(); setActiveTab('add_product'); }}
                      style={{ padding: '8px 16px', borderRadius: '10px', background: '#00ff88', color: '#080612', border: 'none', fontWeight: 900, fontSize: '13px', cursor: 'pointer', marginLeft: '10px' }}
                    >
                      + Add Listing
                    </button>
                  </div>
                </div>

                {/* Products Data Table */}
                <div className="glass" style={{ padding: '20px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                  {filteredProducts.length === 0 ? (
                    <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      No product listings found matching your criteria.
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                            <th style={{ padding: '12px 8px' }}>Product</th>
                            <th style={{ padding: '12px 8px' }}>Category</th>
                            <th style={{ padding: '12px 8px' }}>Pricing & Discount</th>
                            <th style={{ padding: '12px 8px' }}>Stock</th>
                            <th style={{ padding: '12px 8px' }}>Review Status</th>
                            <th style={{ padding: '12px 8px' }}>Price Verification</th>
                            <th style={{ padding: '12px 8px', textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredProducts.map(p => {
                            const discount = calculateDiscountPercent(p.mrp, p.sellingPrice);
                            return (
                              <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                <td style={{ padding: '12px 8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <img
                                    src={p.primaryImage}
                                    alt={p.title}
                                    style={{ width: '44px', height: '44px', borderRadius: '10px', objectFit: 'cover' }}
                                  />
                                  <div>
                                    <div style={{ fontWeight: 800, maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                      {p.title}
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                      SKU: {p.sku} | Brand: {p.brand}
                                    </div>
                                  </div>
                                </td>

                                <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>
                                  {p.category}
                                </td>

                                <td style={{ padding: '12px 8px' }}>
                                  <div style={{ fontWeight: 800, color: '#00ff88' }}>
                                    ₹{p.sellingPrice.toLocaleString('en-IN')}
                                  </div>
                                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                    MRP: ₹{p.mrp.toLocaleString('en-IN')} ({discount}% OFF)
                                  </div>
                                </td>

                                <td style={{ padding: '12px 8px' }}>
                                  <span style={{ color: p.stock > 0 ? '#00ff88' : '#ff4444', fontWeight: 800 }}>
                                    {p.stock > 0 ? `${p.stock} units` : 'Out of stock'}
                                  </span>
                                </td>

                                <td style={{ padding: '12px 8px' }}>
                                  <span style={{
                                    fontSize: '11px',
                                    fontWeight: 800,
                                    padding: '4px 10px',
                                    borderRadius: '8px',
                                    background: p.reviewStatus === 'APPROVED' || p.status === 'LIVE' ? 'rgba(0,255,136,0.15)' : p.reviewStatus === 'REJECTED' ? 'rgba(255,68,68,0.15)' : 'rgba(255,215,0,0.15)',
                                    color: p.reviewStatus === 'APPROVED' || p.status === 'LIVE' ? '#00ff88' : p.reviewStatus === 'REJECTED' ? '#ff4444' : '#ffd700'
                                  }}>
                                    {p.reviewStatus || (p.status === 'LIVE' ? 'APPROVED' : 'PENDING_REVIEW')}
                                  </span>
                                  {p.rejectionReason && (
                                    <div style={{ fontSize: '10px', color: '#ff4444', marginTop: '4px' }}>
                                      {p.rejectionReason}
                                    </div>
                                  )}
                                </td>

                                <td style={{ padding: '12px 8px' }}>
                                  {p.verificationStatus === 'verified_live' ? (
                                    <div>
                                      <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', background: 'rgba(0, 212, 255, 0.15)', color: '#00d4ff', border: '1px solid rgba(0, 212, 255, 0.3)' }}>
                                        🛡️ VERIFIED LIVE
                                      </span>
                                      {p.priceVerifiedAt && (
                                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                          Verified: {new Date(p.priceVerifiedAt).toLocaleDateString()}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                      ⏳ Unverified
                                    </span>
                                  )}
                                </td>

                                <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                    <button
                                      onClick={() => setPreviewProduct(p)}
                                      style={{ padding: '6px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', color: 'white', border: 'none', fontSize: '12px', cursor: 'pointer' }}
                                    >
                                      👁️
                                    </button>
                                    <button
                                      onClick={() => handleStartEdit(p)}
                                      style={{ padding: '6px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)', color: 'white', border: 'none', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleArchive(p.id)}
                                      style={{ padding: '6px 10px', borderRadius: '8px', background: 'rgba(255,68,68,0.1)', color: '#ff4444', border: 'none', fontSize: '12px', cursor: 'pointer' }}
                                    >
                                      Archive
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* 3. ADD / EDIT PRODUCT WORKFLOW */}
            {/* ============================================================== */}
            {activeTab === 'add_product' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 2fr) minmax(280px, 1fr)', gap: '24px', alignItems: 'start' }}>
                
                {/* Product Form Card */}
                <div className="glass" style={{ padding: '28px', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 900, margin: 0 }}>
                      {editingProduct ? 'Edit Product Listing' : 'Create New Product Listing'}
                    </h2>
                    <span style={{ fontSize: '12px', color: '#00d4ff' }}>
                      Partner ID: <strong>{currentPartner?.id}</strong>
                    </span>
                  </div>

                  {formFormErrors.length > 0 && (
                    <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(255,68,68,0.15)', border: '1px solid #ff4444', marginBottom: '20px' }}>
                      <div style={{ fontWeight: 800, color: '#ff4444', fontSize: '13px' }}>Please resolve the following:</div>
                      <ul style={{ margin: '6px 0 0 16px', fontSize: '12px', color: '#ff9999' }}>
                        {formFormErrors.map((err, i) => <li key={i}>{err}</li>)}
                      </ul>
                    </div>
                  )}

                  <form onSubmit={(e) => { e.preventDefault(); handleSaveProduct(false); }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    {/* Section 1: Basic Information */}
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#00ff88', marginBottom: '12px' }}>
                        1. BASIC INFORMATION
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                          <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Product Title *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Handcrafted Pure Kanjivaram Silk Saree"
                            value={formTitle}
                            onChange={(e) => setFormTitle(e.target.value)}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--glass-border)', color: 'white' }}
                          />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div>
                            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Category *</label>
                            <select
                              value={formCategory}
                              onChange={(e) => setFormCategory(e.target.value as any)}
                              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: '#0e0a22', border: '1px solid var(--glass-border)', color: 'white' }}
                            >
                              <option value="Fashion">Fashion & Clothing</option>
                              <option value="Jewellery">Jewellery</option>
                              <option value="Undergarments & Lingerie">Undergarments & Lingerie</option>
                              <option value="Mobiles & Smartphones">Mobiles & Smartphones</option>
                              <option value="Audio & Headphones">Audio & Headphones</option>
                              <option value="Home & Living">Home & Living</option>
                              <option value="Beauty & Personal Care">Beauty & Personal Care</option>
                            </select>
                          </div>

                          <div>
                            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Brand Name</label>
                            <input
                              type="text"
                              placeholder="Brand"
                              value={formBrand}
                              onChange={(e) => setFormBrand(e.target.value)}
                              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--glass-border)', color: 'white' }}
                            />
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div>
                            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Unique Seller SKU</label>
                            <input
                              type="text"
                              placeholder="e.g. SKUCRAFT-101"
                              value={formSku}
                              onChange={(e) => setFormSku(e.target.value)}
                              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--glass-border)', color: 'white' }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Subcategory (Optional)</label>
                            <input
                              type="text"
                              placeholder="e.g. Sarees, Kurtas, Earbuds"
                              value={formSubcategory}
                              onChange={(e) => setFormSubcategory(e.target.value)}
                              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--glass-border)', color: 'white' }}
                            />
                          </div>
                        </div>

                        <div>
                          <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Product Description</label>
                          <textarea
                            rows={3}
                            placeholder="Detailed product specifications, fabric, care instructions, warranty..."
                            value={formDescription}
                            onChange={(e) => setFormDescription(e.target.value)}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--glass-border)', color: 'white' }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Pricing & Inventory */}
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#00ff88', marginBottom: '12px' }}>
                        2. PRICING & INVENTORY
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                        <div>
                          <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>MRP (₹) *</label>
                          <input
                            type="number"
                            min="1"
                            required
                            value={formMrp}
                            onChange={(e) => setFormMrp(parseFloat(e.target.value) || 0)}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--glass-border)', color: 'white' }}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Selling Price (₹) *</label>
                          <input
                            type="number"
                            min="1"
                            required
                            value={formSellingPrice}
                            onChange={(e) => setFormSellingPrice(parseFloat(e.target.value) || 0)}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--glass-border)', color: 'white' }}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Calculated Discount</label>
                          <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(0, 255, 136, 0.1)', border: '1px solid rgba(0,255,136,0.3)', color: '#00ff88', fontWeight: 900 }}>
                            {calculateDiscountPercent(formMrp, formSellingPrice)}% OFF
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                        <div>
                          <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Inventory Stock Quantity *</label>
                          <input
                            type="number"
                            min="0"
                            required
                            value={formStock}
                            onChange={(e) => setFormStock(parseInt(e.target.value, 10) || 0)}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--glass-border)', color: 'white' }}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Shipping Charges (₹) (0 for Free)</label>
                          <input
                            type="number"
                            min="0"
                            value={formShippingCharges}
                            onChange={(e) => setFormShippingCharges(parseFloat(e.target.value) || 0)}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--glass-border)', color: 'white' }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Purchasing URL & Buy Link */}
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#00ff88', marginBottom: '12px' }}>
                        3. BUY LINK & CHECKOUT DESTINATION
                      </h4>
                      <div>
                        <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                          Product Purchase URL (http:// or https://)
                        </label>
                        <input
                          type="url"
                          placeholder="https://yourstore.com/products/item-slug?aff_id=buywise"
                          value={formPurchaseUrl}
                          onChange={(e) => setFormPurchaseUrl(e.target.value)}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--glass-border)', color: 'white' }}
                        />
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                          Shoppers clicking &quot;Buy from Merchant&quot; will be redirected here. Legitimate UTM and affiliate tags are preserved.
                        </div>
                      </div>
                    </div>

                    {/* Section 4: Media & Image Uploads */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#00ff88', margin: 0 }}>
                          4. PRODUCT IMAGES
                        </h4>
                        <span style={{ fontSize: '11px', color: '#00d4ff', background: 'rgba(0, 212, 255, 0.1)', padding: '2px 8px', borderRadius: '6px', border: '1px solid rgba(0, 212, 255, 0.2)' }}>
                          ☁️ Firebase Storage Persistent Binary Uploads
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            disabled={uploadingImage}
                            onClick={() => fileInputRef.current?.click()}
                            style={{ 
                              padding: '8px 16px', 
                              borderRadius: '10px', 
                              background: uploadingImage ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.08)', 
                              color: uploadingImage ? 'var(--text-secondary)' : 'white', 
                              border: '1px solid var(--glass-border)', 
                              fontWeight: 800, 
                              fontSize: '12px', 
                              cursor: uploadingImage ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            {uploadingImage ? `⏳ Uploading (${uploadProgress}%)...` : '📷 Upload Image File (JPEG/PNG/WebP, <5MB)'}
                          </button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            style={{ display: 'none' }}
                            onChange={handleImageFileChange}
                          />
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>or paste image URL:</span>
                        </div>

                        {uploadingImage && (
                          <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(0, 255, 136, 0.05)', border: '1px solid rgba(0, 255, 136, 0.2)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#00ff88', marginBottom: '6px', fontWeight: 700 }}>
                              <span>Uploading to partner-uploads/{currentPartner?.id || 'partner'}/*</span>
                              <span>{uploadProgress}%</span>
                            </div>
                            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'linear-gradient(90deg, #00ff88, #00d4ff)', transition: 'width 0.2s ease' }} />
                            </div>
                          </div>
                        )}

                        {imageUploadError && (
                          <div style={{ fontSize: '12px', color: '#ff4444', background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)', padding: '8px 12px', borderRadius: '8px' }}>
                            ⚠️ {imageUploadError}
                          </div>
                        )}

                        <div>
                          <input
                            type="url"
                            placeholder="https://images.unsplash.com/... or storage download URL"
                            value={formPrimaryImage}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormPrimaryImage(val);
                              if (val && !formImages.includes(val)) {
                                setFormImages(prev => [val, ...prev]);
                              }
                            }}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--glass-border)', color: 'white' }}
                          />
                        </div>

                        {/* Image Preview Strip */}
                        {formImages.length > 0 && (
                          <div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                              Click image to set as Primary. Click (×) to remove:
                            </div>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                              {formImages.map((img, idx) => {
                                const isPrimary = formPrimaryImage === img;
                                return (
                                  <div 
                                    key={idx} 
                                    style={{ 
                                      position: 'relative', 
                                      width: '74px', 
                                      height: '74px', 
                                      borderRadius: '10px', 
                                      overflow: 'hidden', 
                                      border: isPrimary ? '2px solid #00ff88' : '1px solid var(--glass-border)',
                                      cursor: 'pointer'
                                    }}
                                    onClick={() => setFormPrimaryImage(img)}
                                    title={isPrimary ? 'Primary Image' : 'Click to set as primary'}
                                  >
                                    <img src={img} alt="Thumb" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    {isPrimary && (
                                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,255,136,0.9)', color: '#080612', fontSize: '9px', fontWeight: 900, textAlign: 'center', padding: '1px 0' }}>
                                        PRIMARY
                                      </div>
                                    )}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveImage(img);
                                      }}
                                      style={{
                                        position: 'absolute',
                                        top: '2px',
                                        right: '2px',
                                        width: '18px',
                                        height: '18px',
                                        borderRadius: '50%',
                                        background: 'rgba(0,0,0,0.7)',
                                        color: '#ff4444',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        fontSize: '11px',
                                        fontWeight: 900,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        padding: 0
                                      }}
                                      title="Remove image"
                                    >
                                      ×
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Section 5: Virtual Try-On Attributes */}
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#00ff88', marginBottom: '12px' }}>
                        5. VIRTUAL TRY-ON (BUYWISE VTO)
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Garment Try-On Category</label>
                          <select
                            value={formGarmentCat}
                            onChange={(e) => setFormGarmentCat(e.target.value as any)}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: '#0e0a22', border: '1px solid var(--glass-border)', color: 'white' }}
                          >
                            <option value="saree">Saree & Ethnic Wear</option>
                            <option value="dresses">Dresses & Gowns</option>
                            <option value="upper_body">Upper Body (Shirts, Tops, Kurtis)</option>
                            <option value="lower_body">Lower Body (Jeans, Skirts, Pants)</option>
                            <option value="accessories">Jewellery & Accessories</option>
                          </select>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '20px' }}>
                          <input
                            type="checkbox"
                            id="tryOnCheck"
                            checked={formTryOn}
                            onChange={(e) => setFormTryOn(e.target.checked)}
                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                          />
                          <label htmlFor="tryOnCheck" style={{ fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                            Enable Maya AI Virtual Try-On
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Form Action Buttons */}
                    <div style={{ display: 'flex', gap: '12px', marginTop: '20px', borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
                      <button
                        type="submit"
                        disabled={formSubmitting}
                        style={{
                          padding: '12px 24px',
                          borderRadius: '12px',
                          background: '#00ff88',
                          color: '#080612',
                          fontWeight: 900,
                          fontSize: '14px',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        {formSubmitting ? 'Saving...' : editingProduct ? '✔ Update Listing' : '🚀 Submit for Review & Verification'}
                      </button>

                      {!editingProduct && (
                        <button
                          type="button"
                          onClick={() => handleSaveProduct(true)}
                          disabled={formSubmitting}
                          style={{
                            padding: '12px 20px',
                            borderRadius: '12px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            color: 'white',
                            fontWeight: 800,
                            fontSize: '13px',
                            border: '1px solid var(--glass-border)',
                            cursor: 'pointer'
                          }}
                        >
                          💾 Save Draft
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => { resetProductForm(); setActiveTab('products'); }}
                        style={{
                          padding: '12px 20px',
                          borderRadius: '12px',
                          background: 'transparent',
                          color: 'var(--text-secondary)',
                          fontWeight: 800,
                          fontSize: '13px',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                    </div>

                  </form>
                </div>

                {/* Live Shopper Preview Card */}
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '12px' }}>
                    📱 LIVE SHOPPER PREVIEW
                  </div>
                  <div className="glass" style={{ borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                    <div style={{ height: '220px', position: 'relative' }}>
                      <img
                        src={formPrimaryImage || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800'}
                        alt="Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <span style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', padding: '4px 8px', borderRadius: '8px', fontSize: '11px', color: '#00ff88', fontWeight: 800 }}>
                        {currentPartner?.brandName || 'BuyWise Partner'}
                      </span>
                    </div>

                    <div style={{ padding: '16px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 6px 0', lineHeight: 1.3 }}>
                        {formTitle || 'Sample Product Title'}
                      </h4>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                        {formCategory} • SKU: {formSku || 'SKU-SAMPLE'}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '12px' }}>
                        <span style={{ fontSize: '20px', fontWeight: 900, color: '#00ff88' }}>
                          ₹{formSellingPrice.toLocaleString('en-IN')}
                        </span>
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)', textDecoration: 'line-through' }}>
                          ₹{formMrp.toLocaleString('en-IN')}
                        </span>
                        <span style={{ fontSize: '11px', color: '#ffd700', fontWeight: 800 }}>
                          {calculateDiscountPercent(formMrp, formSellingPrice)}% OFF
                        </span>
                      </div>

                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                        {formShippingCharges > 0 ? `+ ₹${formShippingCharges} Delivery` : '✔ Free Delivery by Partner'}
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          style={{ flex: 1, padding: '10px', borderRadius: '10px', background: 'var(--gradient-accent)', color: 'white', fontWeight: 800, fontSize: '12px', border: 'none' }}
                        >
                          👗 Try On (Maya AI)
                        </button>
                        <button
                          type="button"
                          style={{ flex: 1, padding: '10px', borderRadius: '10px', background: '#00ff88', color: '#080612', fontWeight: 900, fontSize: '12px', border: 'none' }}
                        >
                          Buy Now
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* ============================================================== */}
            {/* 4. BULK CSV UPLOAD WIZARD */}
            {/* ============================================================== */}
            {activeTab === 'bulk_upload' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="glass" style={{ padding: '28px', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <h2 style={{ fontSize: '20px', fontWeight: 900, margin: 0 }}>
                        Bulk Product CSV Import Wizard
                      </h2>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Import dozens or hundreds of listings into your store in safe batches.
                      </div>
                    </div>
                    <button
                      onClick={handleDownloadCsvTemplate}
                      style={{ padding: '10px 18px', borderRadius: '12px', background: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid var(--glass-border)', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}
                    >
                      📥 Download CSV Template
                    </button>
                  </div>

                  {/* Upload Drop Zone */}
                  <div style={{
                    border: '2px dashed var(--glass-border)',
                    borderRadius: '16px',
                    padding: '40px 20px',
                    textAlign: 'center',
                    background: 'rgba(255,255,255,0.02)',
                    marginBottom: '24px'
                  }}>
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>📊</div>
                    <div style={{ fontSize: '15px', fontWeight: 800, marginBottom: '6px' }}>
                      Choose your filled CSV catalog file
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                      Required columns: Title, Category, Price, MRP, Stock.
                    </div>
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      onChange={handleCsvFileSelect}
                      style={{ color: 'var(--text-secondary)', fontSize: '13px' }}
                    />
                  </div>

                  {/* Errors Report */}
                  {csvRowErrors.length > 0 && (
                    <div style={{ padding: '16px 20px', borderRadius: '12px', background: 'rgba(255,68,68,0.15)', border: '1px solid #ff4444', marginBottom: '24px' }}>
                      <div style={{ fontWeight: 800, color: '#ff4444', fontSize: '14px' }}>
                        Row Validation Errors ({csvRowErrors.length})
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 10px 0' }}>
                        Rows with errors will be skipped. You can proceed with valid rows or fix the file.
                      </div>
                      <div style={{ maxHeight: '140px', overflowY: 'auto' }}>
                        <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: '#ff9999' }}>
                          {csvRowErrors.map((err, idx) => <li key={idx}>{err}</li>)}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Preview Valid Rows Table */}
                  {csvParsedRows.length > 0 && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#00ff88' }}>
                          ✔ {csvParsedRows.length} Valid Products Ready for Import
                        </div>
                        <button
                          onClick={handleExecuteBulkImport}
                          disabled={csvImporting}
                          style={{
                            padding: '10px 20px',
                            borderRadius: '12px',
                            background: '#00ff88',
                            color: '#080612',
                            fontWeight: 900,
                            fontSize: '13px',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          {csvImporting ? 'Importing Batch...' : `🚀 Import ${csvParsedRows.length} Products to Review Queue`}
                        </button>
                      </div>

                      <div style={{ maxHeight: '280px', overflowY: 'auto', border: '1px solid var(--glass-border)', borderRadius: '12px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                          <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.04)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                              <th style={{ padding: '10px' }}>Title</th>
                              <th style={{ padding: '10px' }}>Category</th>
                              <th style={{ padding: '10px' }}>SKU</th>
                              <th style={{ padding: '10px' }}>Price</th>
                              <th style={{ padding: '10px' }}>MRP</th>
                              <th style={{ padding: '10px' }}>Stock</th>
                            </tr>
                          </thead>
                          <tbody>
                            {csvParsedRows.slice(0, 10).map((row, idx) => (
                              <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                <td style={{ padding: '10px', fontWeight: 700 }}>{row.title}</td>
                                <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>{row.category}</td>
                                <td style={{ padding: '10px' }}>{row.sku}</td>
                                <td style={{ padding: '10px', color: '#00ff88' }}>₹{row.sellingPrice}</td>
                                <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>₹{row.mrp}</td>
                                <td style={{ padding: '10px' }}>{row.stock} units</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Import Results Banner */}
                  {csvImportResult && (
                    <div style={{ marginTop: '20px', padding: '16px 20px', borderRadius: '12px', background: 'rgba(0,255,136,0.15)', border: '1px solid #00ff88' }}>
                      <div style={{ fontWeight: 800, color: '#00ff88', fontSize: '14px' }}>
                        Import Finished: {csvImportResult.created} products added to review queue.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* 5. PRODUCT ANALYTICS & REPORTS */}
            {/* ============================================================== */}
            {activeTab === 'analytics' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Header & Date Range Filter */}
                <div className="glass" style={{ padding: '20px 24px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 900, margin: 0 }}>Catalog Performance & Analytics</h3>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Real impressions, views, outbound clicks, and conversion telemetry.
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Range:</span>
                    {(['today', '7d', '30d', '90d', 'all'] as const).map(rng => (
                      <button
                        key={rng}
                        onClick={() => setDateRange(rng)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: 'none',
                          background: dateRange === rng ? 'var(--gradient-accent)' : 'rgba(255,255,255,0.06)',
                          color: dateRange === rng ? 'white' : 'var(--text-secondary)',
                          fontSize: '12px',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        {rng.toUpperCase()}
                      </button>
                    ))}

                    <button
                      onClick={handleExportAnalyticsCsv}
                      style={{ padding: '8px 16px', borderRadius: '10px', background: '#00d4ff', color: '#080612', border: 'none', fontWeight: 900, fontSize: '13px', cursor: 'pointer', marginLeft: '8px' }}
                    >
                      📥 Export CSV Report
                    </button>
                  </div>
                </div>

                {/* Performance KPIs Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '16px'
                }}>
                  <div className="glass" style={{ padding: '20px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 700 }}>Total Product Views</div>
                    <div style={{ fontSize: '32px', fontWeight: 900, marginTop: '8px', color: '#00d4ff' }}>
                      {analyticsSummary.totalViews}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>Detail views recorded</div>
                  </div>

                  <div className="glass" style={{ padding: '20px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 700 }}>Outbound Buy Clicks</div>
                    <div style={{ fontSize: '32px', fontWeight: 900, marginTop: '8px', color: '#00ff88' }}>
                      {analyticsSummary.totalOutboundClicks}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>Redirects to checkout</div>
                  </div>

                  <div className="glass" style={{ padding: '20px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 700 }}>Click-Through Rate (CTR)</div>
                    <div style={{ fontSize: '32px', fontWeight: 900, marginTop: '8px', color: '#ffd700' }}>
                      {analyticsSummary.clickThroughRate}%
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>Clicks ÷ Exposure</div>
                  </div>

                  <div className="glass" style={{ padding: '20px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 700 }}>Attributed Orders</div>
                    <div style={{ fontSize: '32px', fontWeight: 900, marginTop: '8px' }}>
                      {analyticsSummary.attributedOrders}
                    </div>
                    <div style={{ fontSize: '11px', color: '#00ff88', marginTop: '4px' }}>Real platform purchases</div>
                  </div>
                </div>

                {/* Top Performing Products Table */}
                <div className="glass" style={{ padding: '24px', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 900, margin: '0 0 16px 0' }}>
                    Top Performing Products in Selected Window
                  </h4>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                          <th style={{ padding: '10px' }}>Product</th>
                          <th style={{ padding: '10px' }}>Category</th>
                          <th style={{ padding: '10px' }}>Price</th>
                          <th style={{ padding: '10px' }}>Views</th>
                          <th style={{ padding: '10px' }}>Buy Clicks</th>
                          <th style={{ padding: '10px' }}>CTR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.slice(0, 8).map((p, idx) => {
                          const topStat = analyticsSummary.topProducts.find(tp => tp.productId === p.id);
                          return (
                            <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                              <td style={{ padding: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <img src={p.primaryImage} alt="" style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover' }} />
                                <span style={{ fontWeight: 700 }}>{p.title}</span>
                              </td>
                              <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>{p.category}</td>
                              <td style={{ padding: '10px', fontWeight: 800 }}>₹{p.sellingPrice.toLocaleString('en-IN')}</td>
                              <td style={{ padding: '10px' }}>{topStat ? topStat.views : 0}</td>
                              <td style={{ padding: '10px', color: '#00ff88', fontWeight: 700 }}>{topStat ? topStat.clicks : 0}</td>
                              <td style={{ padding: '10px', color: '#ffd700' }}>{topStat ? `${topStat.ctr}%` : '0%'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* 6. ORDERS & FULFILLMENT TAB */}
            {/* ============================================================== */}
            {activeTab === 'orders' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="glass" style={{ padding: '20px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 900, margin: 0 }}>Partner Fulfillment & Orders</h3>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Orders routed to your warehouse for dispatch.
                    </div>
                  </div>
                </div>

                <div className="glass" style={{ padding: '20px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                  {orders.length === 0 ? (
                    <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      No partner orders recorded yet.
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                            <th style={{ padding: '12px 8px' }}>Order #</th>
                            <th style={{ padding: '12px 8px' }}>Customer & Destination</th>
                            <th style={{ padding: '12px 8px' }}>Items</th>
                            <th style={{ padding: '12px 8px' }}>Total Amount</th>
                            <th style={{ padding: '12px 8px' }}>Status</th>
                            <th style={{ padding: '12px 8px', textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.map(ord => (
                            <tr key={ord.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                              <td style={{ padding: '12px 8px', fontWeight: 800 }}>
                                {ord.orderNumber}
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                  {new Date(ord.createdAt).toLocaleDateString()}
                                </div>
                              </td>

                              <td style={{ padding: '12px 8px' }}>
                                <div style={{ fontWeight: 700 }}>{ord.shippingAddress?.fullName}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                  {ord.shippingAddress?.city}, {ord.shippingAddress?.pincode}
                                </div>
                              </td>

                              <td style={{ padding: '12px 8px' }}>
                                {ord.items.map((it, i) => (
                                  <div key={i} style={{ fontSize: '12px' }}>
                                    {it.title} (x{it.quantity})
                                  </div>
                                ))}
                              </td>

                              <td style={{ padding: '12px 8px', fontWeight: 800, color: '#00ff88' }}>
                                ₹{ord.totalAmount.toLocaleString('en-IN')}
                              </td>

                              <td style={{ padding: '12px 8px' }}>
                                <span style={{
                                  fontSize: '11px',
                                  fontWeight: 800,
                                  padding: '4px 10px',
                                  borderRadius: '8px',
                                  background: ord.orderStatus === 'DELIVERED' ? 'rgba(0,255,136,0.15)' : ord.orderStatus === 'SHIPPED' ? 'rgba(0,212,255,0.15)' : 'rgba(255,215,0,0.15)',
                                  color: ord.orderStatus === 'DELIVERED' ? '#00ff88' : ord.orderStatus === 'SHIPPED' ? '#00d4ff' : '#ffd700'
                                }}>
                                  {ord.orderStatus}
                                </span>
                              </td>

                              <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                                <button
                                  onClick={() => setSelectedOrderForTracking(ord)}
                                  style={{ padding: '6px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)', color: 'white', border: 'none', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
                                >
                                  Update Dispatch
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* 7. STORE PROFILE TAB */}
            {/* ============================================================== */}
            {activeTab === 'profile' && (
              <div className="glass" style={{ padding: '28px', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 900, marginBottom: '20px' }}>Merchant Store Profile</h3>
                {currentPartner && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Store Brand Name</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, marginTop: '4px' }}>{currentPartner.brandName}</div>
                    </div>

                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Registered Company</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, marginTop: '4px' }}>{currentPartner.companyName}</div>
                    </div>

                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>GSTIN / Tax Identifier</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, marginTop: '4px' }}>{currentPartner.gstNumber || 'GST Verified'}</div>
                    </div>

                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Commission Agreement</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#00d4ff', marginTop: '4px' }}>
                        {currentPartner.commissionValue}% {currentPartner.commissionType}
                      </div>
                    </div>

                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Merchant Location</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, marginTop: '4px' }}>
                        {currentPartner.city}, {currentPartner.state}
                      </div>
                    </div>

                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Onboarding Status</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#00ff88', marginTop: '4px' }}>
                        ✔ {currentPartner.status}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ============================================================== */}
            {/* 8. SETTINGS TAB */}
            {/* ============================================================== */}
            {activeTab === 'settings' && (
              <div className="glass" style={{ padding: '28px', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 900, marginBottom: '16px' }}>Account & Webhook Settings</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                    <div style={{ fontWeight: 800, fontSize: '14px' }}>Webhook Notification Endpoint</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Configure your ERP endpoint to receive instant order dispatches.
                    </div>
                    <input
                      type="url"
                      defaultValue="https://api.yourbrand.com/webhooks/buywise"
                      style={{ marginTop: '10px', width: '100%', maxWidth: '480px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--glass-border)', color: 'white' }}
                    />
                  </div>

                  <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                    <div style={{ fontWeight: 800, fontSize: '14px' }}>Inventory Auto-Sync</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Automatically set listings to Out of Stock when warehouse inventory hits zero.
                    </div>
                    <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input type="checkbox" defaultChecked id="autoStockCheck" style={{ width: '16px', height: '16px' }} />
                      <label htmlFor="autoStockCheck" style={{ fontSize: '13px' }}>Enable Auto-Sync Protection</label>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </>
        )}
      </section>

      {/* Fulfillment Modal */}
      {selectedOrderForTracking && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div className="glass" style={{ maxWidth: '480px', width: '100%', padding: '24px', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 900, margin: '0 0 16px 0' }}>
              Update Order #{selectedOrderForTracking.orderNumber}
            </h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              await updateOrderStatus(selectedOrderForTracking.id, newOrderStatus, {
                courierCarrier,
                trackingNumber,
                note: statusNote
              });
              setSelectedOrderForTracking(null);
              if (currentPartner) await refreshPartnerData(currentPartner.id);
              alert('Order dispatch status updated.');
            }} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Status</label>
                <select
                  value={newOrderStatus}
                  onChange={(e) => setNewOrderStatus(e.target.value as any)}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', background: '#0e0a22', border: '1px solid var(--glass-border)', color: 'white' }}
                >
                  <option value="PACKING">PACKING</option>
                  <option value="SHIPPED">SHIPPED</option>
                  <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
                  <option value="DELIVERED">DELIVERED</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Courier Partner</label>
                <input
                  type="text"
                  value={courierCarrier}
                  onChange={(e) => setCourierCarrier(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--glass-border)', color: 'white' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Tracking AWB / Number</label>
                <input
                  type="text"
                  placeholder="AWB12345678"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--glass-border)', color: 'white' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', background: '#00ff88', color: '#080612', fontWeight: 900, border: 'none', cursor: 'pointer' }}
                >
                  Save Dispatch
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOrderForTracking(null)}
                  style={{ padding: '12px 18px', borderRadius: '10px', background: 'rgba(255,255,255,0.08)', color: 'white', border: 'none', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Quick-View Modal */}
      {previewProduct && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div className="glass" style={{ maxWidth: '440px', width: '100%', padding: '24px', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
            <img src={previewProduct.primaryImage} alt="" style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '12px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 900, margin: '14px 0 6px 0' }}>{previewProduct.title}</h3>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
              Category: {previewProduct.category} | SKU: {previewProduct.sku}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '14px' }}>
              <span style={{ fontSize: '22px', fontWeight: 900, color: '#00ff88' }}>₹{previewProduct.sellingPrice}</span>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', textDecoration: 'line-through' }}>₹{previewProduct.mrp}</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.5 }}>
              {previewProduct.description}
            </div>
            <button
              onClick={() => setPreviewProduct(null)}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer' }}
            >
              Close
            </button>
          </div>
        </div>
      )}

    </main>
  );
}
