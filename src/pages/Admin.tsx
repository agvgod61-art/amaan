import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { db, handleFirestoreError, OperationType, isQuotaError, storage } from "../lib/firebase";
import { doc, setDoc, collection, serverTimestamp, getDocs, updateDoc, deleteDoc, query, orderBy, getDoc, limit, getDocsFromCache } from "../lib/firebase";
import { ref, deleteObject } from "firebase/storage";
import { Loader2, Database, AlertCircle, ShoppingBag, Package, Plus, Trash2, Edit2, X, UserPlus, Users, ShieldCheck, RefreshCw, LayoutGrid, Settings, Shield, LineChart, FileText, PlayCircle, PackageCheck, CheckCircle2, XCircle, MessageCircle, Star, Maximize2, Upload, Link as LinkIcon, ShoppingCart } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { products as initialProducts } from "../data/products";
import { cn } from "../lib/utils";
import ImageUpload from "../components/ImageUpload";
import MultiImageUpload from "../components/MultiImageUpload";
import { getEmbedUrl } from "../lib/mediaUtils";
import StorageImage from '../components/StorageImage';

import AdminDashboardCharts from "../components/AdminDashboardCharts";
import AdminPromoUpload from "../components/AdminPromoUpload";

type AdminTab = "dashboard" | "orders" | "products" | "categories" | "admins" | "media" | "setup" | "site" | "reviews" | "security" | "customers";

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>(() => {
    const saved = localStorage.getItem('admin_active_tab');
    if (saved) {
      localStorage.removeItem('admin_active_tab');
      return saved as AdminTab;
    }
    return "dashboard";
  });
  const [purgeStatus, setPurgeStatus] = useState<'idle' | 'scanning' | 'done'>('idle');
  const [invalidProducts, setInvalidProducts] = useState<any[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState("");
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  
  // Data states
  const [orders, setOrders] = useState<any[]>([]);
  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [siteSettings, setSiteSettings] = useState<any>(null);
  const [gallerySettings, setGallerySettings] = useState<any>({
    wideImage: "https://images.unsplash.com/photo-1542125387-c71274d94f0a?q=80&w=2070&auto=format&fit=crop",
    squareImage1: "https://images.unsplash.com/photo-1626014303757-6bcbe6762b32?q=80&w=2073&auto=format&fit=crop",
    squareImage2: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=2070&auto=format&fit=crop",
    technicalImage: "https://images.unsplash.com/photo-1542124536-1e967396796c?auto=format&fit=crop&q=80&w=1200"
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletedHistory, setDeletedHistory] = useState<{id: string, name: string, time: string, price: number, type: string}[]>([]);
  const [adminList, setAdminList] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<{totalViews: number, uniqueVisits: number}>({ totalViews: 0, uniqueVisits: 0 });
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [cartCounts, setCartCounts] = useState<Record<string, number>>({});

  const fetchCartCounts = async () => {
    try {
      const snap = await getDocs(collection(db, "cart_items"));
      const counts: Record<string, number> = {};
      snap.forEach(doc => {
        const data = doc.data();
        if (data.product && data.product.id) {
          // Counting how many cart entries exist for this product (i.e. how many times it was added)
          counts[data.product.id] = (counts[data.product.id] || 0) + 1;
        }
      });
      setCartCounts(counts);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, "cart_items");
    }
  };
  const [refreshCountdown, setRefreshCountdown] = useState(300);
  const [newCategory, setNewCategory] = useState({ name: "", slug: "", description: "", order: 0, image: "" });
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [bulkDeleteCountdown, setBulkDeleteCountdown] = useState<number | null>(null);
  const [individualDeleteCountdown, setIndividualDeleteCountdown] = useState<{id: string, name: string, price: number, type: string} | null>(null);

  // Form states for adding/editing
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [newProduct, setNewProduct] = useState({ 
    name: "", 
    type: "Full-face", 
    model: "",
    price: 9999, 
    image: "", 
    description: "",
    weight: "",
    images: [""],
    videoUrl: "",
    stock: 20,
    status: "published",
    features: [] as string[],
    pdfUrl: "",
    sizes: [] as string[],
    colors: [] as { name: string; hex: string; image: string }[]
  });
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newProductUploadMode, setNewProductUploadMode] = useState<"single" | "batch">("single");
  const [editProductUploadMode, setEditProductUploadMode] = useState<"single" | "batch">("single");
  const [tempColor, setTempColor] = useState({ name: "", hex: "#111827", image: "" });
  const [tempColorEdit, setTempColorEdit] = useState({ name: "", hex: "#111827", image: "" });

  const SUPER_ADMINS = ["yamaan115@gmail.com", "avggod61@gmail.com", "agvgod61@gmail.com"];

  useEffect(() => {
    const checkAuth = async () => {
      if (!user) {
        setIsAuthorized(false);
        return;
      }
      
      if (user.email && SUPER_ADMINS.includes(user.email.toLowerCase())) {
        setIsAuthorized(true);
        return;
      }

      try {
        const adminDoc = await getDoc(doc(db, "admins", user.email || ""));
        setIsAuthorized(adminDoc.exists());
      } catch (err) {
        setIsAuthorized(false);
      }
    };
    checkAuth();
  }, [user]);

  useEffect(() => {
    if (isAuthorized) {
      if (activeTab === "dashboard") {
        if (dbProducts.length === 0) fetchProducts();
        if (categories.length === 0) fetchCategories();
        if (customers.length === 0) fetchCustomers();
        fetchAnalytics();
      }
      if (activeTab === "orders" && orders.length === 0) fetchOrders();
      if (activeTab === "products") {
        if (dbProducts.length === 0) fetchProducts();
        fetchCartCounts();
      }
      if (activeTab === "categories" && categories.length === 0) fetchCategories();
      if (activeTab === "admins" && adminList.length === 0) fetchAdmins();
      if (activeTab === "site") {
        if (!siteSettings) fetchSiteSettings();
        fetchGallerySettings();
      }
      if (activeTab === "reviews" && reviews.length === 0) fetchReviews();
      if (activeTab === "security" && blockedUsers.length === 0) fetchBlockedUsers();
      if (activeTab === "customers" && customers.length === 0) fetchCustomers();
    }
  }, [isAuthorized, activeTab]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isAuthorized && activeTab === "dashboard") {
      interval = setInterval(() => {
        fetchAnalytics();
      }, 60000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAuthorized, activeTab]);

  const fetchAnalytics = async () => {
    try {
      const snap = await getDoc(doc(db, "analytics", "traffic"));
      if (snap.exists()) {
        setAnalytics({
          totalViews: snap.data().totalViews || 0,
          uniqueVisits: snap.data().uniqueVisits || 0
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, "analytics/traffic");
    }
  };

  const fetchCustomers = async () => {
    setStatus("loading");
    try {
      const q = query(collection(db, "customers"), orderBy("createdAt", "desc"), limit(50));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCustomers(data);
      setStatus("idle");
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, "customers");
      setStatus("error");
    }
  };

  const fetchReviews = async () => {
    setStatus("loading");
    try {
      const q = query(
        collection(db, "reviews"), 
        orderBy("createdAt", "desc"),
        limit(50)
      );
      const snap = await getDocs(q);
      setReviews(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setStatus("idle");
    } catch (err) {
      if (isQuotaError(err)) {
        setStatus("error");
        setMessage("MISSION DATA OFFLINE: QUOTA LIMIT REACHED.");
      } else {
        handleFirestoreError(err, OperationType.LIST, "reviews");
        setStatus("error");
      }
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!window.confirm("Permanently delete this review?")) return;
    try {
      const review = reviews.find(r => r.id === id);
      if (review?.image) {
        const { deleteFileFromStorage } = await import('../services/storageService');
        await deleteFileFromStorage(review.image).catch(console.error);
      }
      await deleteDoc(doc(db, "reviews", id));
      setReviews(reviews.filter(r => r.id !== id));
      setMessage("Review deleted successfully");
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `reviews/${id}`);
    }
  };

  const handlePermitReviewImage = async (id: string) => {
    setStatus("loading");
    try {
      await updateDoc(doc(db, "reviews", id), {
        isAdminReview: true,
        updatedAt: serverTimestamp()
      });
      setReviews(reviews.map(r => r.id === id ? { ...r, isAdminReview: true } : r));
      setStatus("idle");
      setMessage("Media asset permitted for display.");
    } catch (err) {
      if (isQuotaError(err)) {
        setStatus("error");
        setMessage("QUOTA EXCEEDED: FAILED TO UPDATE REVIEW.");
      } else {
        handleFirestoreError(err, OperationType.UPDATE, `reviews/${id}`);
        setStatus("error");
      }
    }
  };

  const fetchBlockedUsers = async () => {
    setStatus("loading");
    try {
      const qBlocked = query(collection(db, "blocked_users"), orderBy("blockedAt", "desc"), limit(50));
      const snapBlocked = await getDocs(qBlocked);
      const blocked = snapBlocked.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(), 
        blockedAt: (doc.data() as any).timestamp?.toDate?.() || (doc.data() as any).timestamp || new Date(0),
        type: 'manual' 
      }));
      
      const qIncidents = query(collection(db, "security_incidents"), orderBy("timestamp", "desc"), limit(50));
      const snapIncidents = await getDocs(qIncidents);
      const incidents = snapIncidents.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(), 
        blockedAt: doc.data().timestamp?.toDate?.() || doc.data().timestamp,
        reason: doc.data().violation || 'Tripwire Triggered',
        type: 'automatic' 
      }));

      setBlockedUsers([...blocked, ...incidents].sort((a, b) => {
        const dateA = a.blockedAt?.seconds || new Date(a.blockedAt).getTime();
        const dateB = b.blockedAt?.seconds || new Date(b.blockedAt).getTime();
        return dateB - dateA;
      }));
      setStatus("idle");
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, "blocked_users");
      setStatus("error");
    }
  };

  const handleBlockUser = async (uid: string, email: string, reason: string) => {
    if (!window.confirm(`PERMANENTLY BLOCK USER ${email}? This cannot be undone.`)) return;
    setStatus("loading");
    try {
      await setDoc(doc(db, "blocked_users", uid), {
        uid,
        email,
        reason,
        blockedAt: serverTimestamp()
      });
      setBlockedUsers([{ uid, email, reason, blockedAt: new Date() }, ...blockedUsers]);
      setMessage(`USER ${email} PERMANENTLY BANNED.`);
      setStatus("idle");
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `blocked_users/${uid}`);
      setStatus("error");
    }
  };

  const handleUnblockUser = async (uid: string, type: 'manual' | 'automatic' = 'manual') => {
    if (!window.confirm("Lift permanent ban for this user?")) return;
    setStatus("loading");
    try {
      if (type === 'manual') {
        await deleteDoc(doc(db, "blocked_users", uid));
      } else {
        await deleteDoc(doc(db, "security_incidents", uid));
      }
      setBlockedUsers(blockedUsers.filter(u => u.uid !== uid));
      setMessage("Ban lifted.");
      setStatus("idle");
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, type === 'manual' ? `blocked_users/${uid}` : `security_incidents/${uid}`);
      setStatus("error");
    }
  };

  const fetchCategories = async (silent = false) => {
    if (!silent) setStatus("loading");
    try {
      const q = query(collection(db, "categories"), orderBy("order", "asc"));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCategories(data);
      if (!silent) setStatus("idle");
    } catch (err) {
      if (isQuotaError(err)) {
        if (!silent) setStatus("error");
        setMessage("QUOTA EXCEEDED: DATABASE READS TEMPORARILY DISABLED.");
      } else {
        handleFirestoreError(err, OperationType.LIST, "categories");
        if (!silent) setStatus("error");
      }
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const id = "CAT-" + Math.random().toString(36).substring(2, 9).toUpperCase();
      const slug = newCategory.slug || newCategory.name.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");
      await setDoc(doc(db, "categories", id), {
        ...newCategory,
        slug,
        createdAt: serverTimestamp()
      });
      setCategories([...categories, { id, ...newCategory, slug }]);
      setNewCategory({ name: "", slug: "", description: "", order: 0, image: "" });
      setStatus("idle");
      setMessage("Category added successfully");
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "categories");
      setStatus("error");
    }
  };

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;
    setStatus("loading");
    try {
      await updateDoc(doc(db, "categories", editingCategory.id), {
        name: editingCategory.name,
        slug: editingCategory.slug,
        description: editingCategory.description || "",
        order: editingCategory.order || 0,
        image: editingCategory.image || "",
        updatedAt: serverTimestamp()
      });
      setCategories(categories.map(c => c.id === editingCategory.id ? editingCategory : c));
      setEditingCategory(null);
      setStatus("idle");
      setMessage("Category updated successfully");
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `categories/${editingCategory.id}`);
      setStatus("error");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm("Delete this category? Products won't be deleted, but they will lose their category link.")) return;
    try {
      const cat = categories.find(c => c.id === id);
      if (cat?.image && !cat.image.startsWith('http') && !cat.image.startsWith('data:') && !cat.image.startsWith('blob:')) {
         const { deleteFileFromStorage } = await import('../services/storageService');
         await deleteFileFromStorage(cat.image).catch(console.error);
      }
      await deleteDoc(doc(db, "categories", id));
      setCategories(categories.filter(c => c.id !== id));
      setMessage("Category removed");
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `categories/${id}`);
    }
  };

  const [purgeMode, setPurgeMode] = useState<'delete_product' | 'cleanup_images'>('cleanup_images');

  const scanForInvalidImages = async () => {
    setPurgeStatus('scanning');
    
    // Accept valid Supabase paths (which do not start with http or data:)
    const isFormatInvalid = (url: string) => {
      if (!url) return true;
      if (url.startsWith('http') || url.startsWith('data:image') || url.startsWith('blob:')) return false;
      // Simple heuristic for supabase paths: contains a slash and no spaces
      return url.includes(' ') || !url.includes('/');
    };
    
    const isImageBroken = async (url: string): Promise<boolean> => {
      if (isFormatInvalid(url)) return true;
      if (url.startsWith('data:') || url.startsWith('blob:')) return false;
      
      let testUrl = url;
      // If it's a Supabase path without http, fetch the signed URL to test it
      if (!url.startsWith('http')) {
         const { getSignedImageUrl } = await import('../services/storageService');
         const signedUrl = await getSignedImageUrl(url);
         if (signedUrl === url) return true; // could not resolve
         testUrl = signedUrl;
      }
      
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(false);
        img.onerror = () => resolve(true);
        img.src = testUrl;
        setTimeout(() => resolve(true), 5000);
      });
    };

    const invalid = [];
    
    // Scan Products
    for (const p of dbProducts) {
      const mainBroken = await isImageBroken(p.image);
      const galleryBrokenIndices: number[] = [];
      
      if (p.images && Array.isArray(p.images)) {
        for (let i = 0; i < p.images.length; i++) {
          if (p.images[i] && await isImageBroken(p.images[i])) {
            galleryBrokenIndices.push(i);
          }
        }
      }

      if (mainBroken || galleryBrokenIndices.length > 0) {
        invalid.push({
          id: p.id,
          name: p.name,
          collection: 'products',
          mainBroken,
          galleryBrokenIndices,
          images: p.images
        });
      }
    }

    // Scan Categories
    for (const c of categories) {
      if (await isImageBroken(c.image)) {
        invalid.push({
          id: c.id,
          name: c.name,
          collection: 'categories',
          mainBroken: true,
          galleryBrokenIndices: []
        });
      }
    }

    setInvalidProducts(invalid);
    setPurgeStatus('done');
  };

  const handlePurgeInvalid = async () => {
    if (invalidProducts.length === 0) return;
    
    const actionText = purgeMode === 'delete_product' 
      ? `PERMANENTLY DELETE ${invalidProducts.length} entries` 
      : `REMOVE BROKEN IMAGES from ${invalidProducts.length} entries`;

    if (!window.confirm(`${actionText}? This cannot be undone.`)) return;
    
    setStatus('loading');
    try {
      const batchSize = 5;
      for (let i = 0; i < invalidProducts.length; i += batchSize) {
        const batch = invalidProducts.slice(i, i + batchSize);
        await Promise.all(batch.map(async (p) => {
          if (purgeMode === 'delete_product') {
            await deleteDoc(doc(db, p.collection, p.id));
          } else {
            const updates: any = { updatedAt: serverTimestamp() };
            if (p.mainBroken) {
              updates.image = "";
            }
            if (p.galleryBrokenIndices && p.galleryBrokenIndices.length > 0) {
              const newGallery = [...(p.images || [])];
              p.galleryBrokenIndices.sort((a: number, b: number) => b - a).forEach((idx: number) => {
                newGallery.splice(idx, 1);
              });
              updates.images = newGallery;
            }
            await updateDoc(doc(db, p.collection, p.id), updates);
          }
        }));
      }
      
      await fetchProducts(true);
      await fetchCategories(true);
      setInvalidProducts([]);
      setPurgeStatus('idle');
      setMessage(purgeMode === 'delete_product' ? "Database purged successfully." : "Asset cleanup complete.");
      setStatus('idle');
    } catch (err) {
      if (isQuotaError(err)) {
        setStatus("error");
        setMessage("MISSION DATA OFFLINE: QUOTA EXCEEDED. TRY AGAIN LATER.");
      } else {
        handleFirestoreError(err, OperationType.DELETE, "assets/purge");
        setStatus('error');
      }
    }
  };

  useEffect(() => {
    let interval: any;
    if (autoRefresh && isAuthorized && (activeTab === "products" || activeTab === "orders")) {
      interval = setInterval(() => {
        setRefreshCountdown((prev) => {
          if (prev <= 1) {
            if (activeTab === "products") {
              fetchProducts(true);
              fetchCartCounts();
            }
            if (activeTab === "orders") fetchOrders(true);
            return 300; // Increased to 5 minutes to save quota
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [autoRefresh, isAuthorized, activeTab]);

  useEffect(() => {
    if (!autoRefresh) {
      setRefreshCountdown(60);
    }
  }, [autoRefresh]);

  const fetchOrders = async (silent = false) => {
    if (!silent) setStatus("loading");
    try {
      const q = query(collection(db, "orders"), orderBy("created_at", "desc"), limit(50));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(data);
      if (!silent) setStatus("idle");
    } catch (err) {
      if (isQuotaError(err)) {
        if (!silent) setStatus("error");
        setMessage("QUOTA LIMIT REACHED: LOADING LOCAL ORDER ARCHIVE.");
        // Try cache fallback
        try {
          const q = query(collection(db, "orders"), orderBy("created_at", "desc"), limit(50));
          const cacheSnap = await getDocsFromCache(q);
          if (!cacheSnap.empty) {
            setOrders(cacheSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          }
        } catch (e) {
          console.warn("Order cache unavailable");
        }
      } else {
        handleFirestoreError(err, OperationType.LIST, "orders");
        if (!silent) setStatus("error");
      }
    }
  };

  const fetchProducts = async (silent = false) => {
    if (!silent) setStatus("loading");
    try {
      const q = query(collection(db, "products"), orderBy("createdAt", "desc"), limit(100));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDbProducts(data);
      if (!silent) setStatus("idle");
    } catch (err) {
      if (isQuotaError(err)) {
        if (!silent) setStatus("error");
        setMessage("MISSION DATA OFFLINE: QUOTA LIMIT REACHED. LOADING LOCAL CATALOG.");
        
        // Try cache fallback
        try {
          const q = query(collection(db, "products"), orderBy("createdAt", "desc"), limit(100));
          const cacheSnap = await getDocsFromCache(q);
          if (!cacheSnap.empty) {
            setDbProducts(cacheSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          } else {
            setDbProducts(initialProducts);
          }
        } catch (e) {
          setDbProducts(initialProducts);
        }
      } else {
        handleFirestoreError(err, OperationType.LIST, "products");
        if (!silent) setStatus("error");
      }
    }
  };

  const fetchAdmins = async () => {
    setStatus("loading");
    try {
      const q = query(collection(db, "admins"), orderBy("email", "asc"), limit(20));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAdminList(data);
      setStatus("idle");
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, "admins");
      setStatus("error");
    }
  };

  const [showHeroMediaPicker, setShowHeroMediaPicker] = useState(false);

  const fetchSiteSettings = async () => {
    setStatus("loading");
    try {
      const docRef = doc(db, "settings", "general");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSiteSettings(data);
      } else {
        // Initialize default settings if they don't exist
        const defaults = {
          siteName: "AVG GOD",
          logoImage: "",
          heroTitle: "Premium Riding Equipment",
          heroSubtitle: "Engineered for Performance. Built for Safety.",
          heroImage: "https://images.unsplash.com/photo-1558981403-c5f91cb9c231?auto=format&fit=crop&q=80",
          accentColor: "#ef4444",
          contactEmail: "agvgod@gmail.com",
          contactPhone: "+91 91522 45837",
          footerText: "The ultimate destination for motorcycle enthusiasts."
        };
        setSiteSettings(defaults);
      }
      setStatus("idle");
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, "settings/general");
      setStatus("error");
    }
  };

  const handleUpdateSiteSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      await setDoc(doc(db, "settings", "general"), {
        ...siteSettings,
        updatedAt: serverTimestamp()
      });
      setStatus("idle");
      setMessage("Site settings updated successfully");
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "settings/general");
      setStatus("error");
    }
  };

  const fetchGallerySettings = async () => {
    try {
      const docSnap = await getDoc(doc(db, "site_config", "homepage_gallery"));
      if (docSnap.exists()) {
        setGallerySettings(docSnap.data());
      }
    } catch (err) {
      console.warn("Failed to fetch gallery settings, using defaults");
    }
  };

  const handleUpdateGallerySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      await setDoc(doc(db, "site_config", "homepage_gallery"), {
        ...gallerySettings,
        updatedAt: serverTimestamp()
      });
      setStatus("idle");
      setMessage("Gallery settings updated successfully");
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "site_config/homepage_gallery");
      setStatus("error");
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;
    setStatus("loading");
    try {
      const validImages = editingProduct.images?.filter((img: string) => img.trim() !== "") || [];
      const productData = {
        name: editingProduct.name,
        price: editingProduct.price,
        type: editingProduct.type,
        model: editingProduct.model || "",
        description: editingProduct.description || "",
        weight: editingProduct.weight || "",
        features: editingProduct.features || [],
        image: editingProduct.image || validImages[0] || "",
        images: validImages,
        videoUrl: editingProduct.videoUrl || editingProduct.video || "",
        pdfUrl: editingProduct.pdfUrl || "",
        status: editingProduct.status || "published",
        stock: editingProduct.stock || 0,
        sizes: editingProduct.sizes || [],
        colors: editingProduct.colors || [],
        updatedAt: serverTimestamp()
      };

      // Size Check
      const sizeEstimate = JSON.stringify(productData).length;
      if (sizeEstimate > 1000000) {
        setStatus("error");
        setMessage("DATA PACKAGE TOO LARGE: Video or images exceed database limits. Please use smaller files.");
        return;
      }

      await updateDoc(doc(db, "products", editingProduct.id), productData);
      setDbProducts(dbProducts.map(p => p.id === editingProduct.id ? { ...editingProduct, images: validImages } : p));
      setEditingProduct(null);
      setStatus("idle");
      setMessage("PRODUCT settings updated successfully");
    } catch (err) {
      setStatus("error");
      try {
        handleFirestoreError(err, OperationType.UPDATE, `products/${editingProduct.id}`);
      } catch (e: any) {
        console.error(e);
        const errData = JSON.parse(e.message);
        setMessage(`SAVE FAILED: ${errData.error}`);
      }
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : "12345678-1234-1234-1234-123456789012";
      const validImages = newProduct.images.filter((img: string) => img.trim() !== "");
      const productToSave = {
        ...newProduct,
        model: newProduct.model || "",
        image: newProduct.image || validImages[0] || "",
        images: validImages.length > 0 ? validImages : [newProduct.image || ""],
        videoUrl: newProduct.videoUrl || "",
        pdfUrl: newProduct.pdfUrl || "",
        weight: newProduct.weight || "",
        stock: newProduct.stock || 0,
        status: newProduct.status || "published",
        rating: 4.5,
        reviews: 0,
        createdAt: serverTimestamp()
      };

      // Size Check
      const sizeEstimate = JSON.stringify(productToSave).length;
      if (sizeEstimate > 1000000) {
        setStatus("error");
        setMessage("DATA PACKAGE TOO LARGE: Video or images exceed database limits.");
        return;
      }

      await setDoc(doc(db, "products", id), productToSave);
      setDbProducts([{id, ...productToSave}, ...dbProducts]);
      setNewProduct({ 
        name: "", 
        type: "Full-face", 
        model: "",
        price: 0, 
        image: "", 
        description: "",
        weight: "",
        images: [""],
        videoUrl: "",
        stock: 20,
        status: "published",
        features: [],
        pdfUrl: "",
        sizes: [],
        colors: []
      });
      setStatus("idle");
      setMessage("PRODUCT settings updated successfully");
    } catch (err) {
      setStatus("error");
      try {
        handleFirestoreError(err, OperationType.CREATE, "products");
      } catch (e: any) {
        console.error(e);
        try {
          const errData = JSON.parse(e.message);
          setMessage(`CREATE FAILED: ${errData.error}`);
        } catch {
          setMessage(`CREATE FAILED: ${e.message}`);
        }
      }
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email || !SUPER_ADMINS.includes(user.email.toLowerCase())) {
      alert("Only a super admin can grant administrative access.");
      return;
    }
    if (!newAdminEmail.includes("@")) return;
    setStatus("loading");
    try {
      await setDoc(doc(db, "admins", newAdminEmail.toLowerCase()), {
        email: newAdminEmail.toLowerCase(),
        addedAt: serverTimestamp(),
        addedBy: user?.email || "system"
      });
      setAdminList([{id: newAdminEmail, email: newAdminEmail}, ...adminList]);
      setNewAdminEmail("");
      setStatus("idle");
    } catch (err) {
      setStatus("error");
    }
  };

  const handleDeleteAdmin = async (email: string) => {
    if (!user?.email || !SUPER_ADMINS.includes(user.email.toLowerCase())) {
      alert("Only a super admin can revoke administrative access.");
      return;
    }
    if (email && SUPER_ADMINS.includes(email.toLowerCase())) {
      alert("Cannot delete a primary super admin");
      return;
    }
    if (!window.confirm(`Remove ${email} from admins?`)) return;
    try {
      await deleteDoc(doc(db, "admins", email));
      setAdminList(adminList.filter(a => a.id !== email));
    } catch (err) {
      alert("Delete failed");
    }
  };

  const handleDeleteOrder = async (id: string) => {
    if (!window.confirm("Permanently delete this order record?")) return;
    try {
      await deleteDoc(doc(db, "orders", id));
      setOrders(orders.filter(o => o.id !== id));
      setMessage("Order deleted");
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `orders/${id}`);
    }
  };

  const seedProducts = async () => {
    if (!user?.email || !SUPER_ADMINS.includes(user.email.toLowerCase())) {
      alert("Only a super admin can perform database seeding.");
      return;
    }
    setStatus('loading');
    setMessage("Starting seeding process...");
    try {
      let count = 0;
      for (const product of initialProducts) {
        const { id, ...data } = product;
        await setDoc(doc(db, "products", id), { 
          ...data, 
          status: 'published',
          createdAt: serverTimestamp() 
        });
        count++;
      }
      setStatus('success');
      setMessage(`Successfully seeded ${count} products.`);
    } catch (error) {
      setStatus('error');
      setMessage("Seeding failed");
    }
  };

  const seedSuperAdmin = async () => {
    if (!user?.email) return;
    setStatus('loading');
    try {
      await setDoc(doc(db, "admins", user.email.toLowerCase()), {
        email: user.email.toLowerCase(),
        addedAt: serverTimestamp(),
        addedBy: "initial-setup"
      });
      setIsAuthorized(true);
      setStatus('success');
      setMessage("Account authorized as admin.");
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `admins/${user.email}`);
      setStatus('error');
    }
  };

  const clearLiveCatalog = async () => {
    if (!window.confirm("CRITICAL: This will permanently delete ALL products from your live database. Continue?")) return;
    setStatus('loading');
    try {
      const snap = await getDocs(collection(db, "products"));
      
      const cleanupStorage = async (url: string) => {
        if (!url) return;
        if (!url.startsWith('http') && !url.startsWith('data:') && !url.startsWith('blob:')) {
          try {
             const { deleteFileFromStorage } = await import('../services/storageService');
             await deleteFileFromStorage(url);
          } catch (e) {
             console.warn("Failed to delete file from storage:", e);
          }
        }
      };

      for (const d of snap.docs) {
        const product = d.data();
        if (product.image) await cleanupStorage(product.image);
        if (product.images && Array.isArray(product.images)) {
          for (const imgUrl of product.images) await cleanupStorage(imgUrl);
        }
        if (product.colors && Array.isArray(product.colors)) {
          for (const color of product.colors) {
            if (color.image) await cleanupStorage(color.image);
          }
        }
      }

      const deletePromises = snap.docs.map(d => deleteDoc(doc(db, "products", d.id)));
      await Promise.all(deletePromises);
      setDbProducts([]);
      setStatus('success');
      setMessage("Live catalog cleared successfully.");
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, "products");
      setStatus('error');
    }
  };

  const clearOrders = async () => {
    if (!window.confirm("CRITICAL: This will permanently delete ALL order records. Continue?")) return;
    setStatus('loading');
    try {
      const snap = await getDocs(collection(db, "orders"));
      const deletePromises = snap.docs.map(d => deleteDoc(doc(db, "orders", d.id)));
      await Promise.all(deletePromises);
      setOrders([]);
      setStatus('success');
      setMessage("All orders cleared successfully.");
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, "orders");
      setStatus('error');
    }
  };

  const clearCategories = async () => {
    if (!window.confirm("CRITICAL: This will permanently delete ALL categories from your library. Continue?")) return;
    setStatus('loading');
    try {
      const snap = await getDocs(collection(db, "categories"));
      const deletePromises = snap.docs.map(d => deleteDoc(doc(db, "categories", d.id)));
      await Promise.all(deletePromises);
      setCategories([]);
      setStatus('success');
      setMessage("All categories cleared successfully.");
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, "categories");
      setStatus('error');
    }
  };

  const wipeAllData = async () => {
    if (!window.confirm("NUCLEAR OPTION: This will delete EVERYTHING (Products, Orders). Are you absolutely sure?")) return;
    const confirmation = window.prompt("Type 'DELETE' to confirm master reset");
    if (confirmation !== "DELETE") {
      setMessage("Wipe cancelled: Confirmation string mismatch.");
      return;
    }
    
    setStatus('loading');
    try {
      const pSnap = await getDocs(collection(db, "products"));
      const oSnap = await getDocs(collection(db, "orders"));
      
      const allDeletes = [
        ...pSnap.docs.map(d => deleteDoc(doc(db, "products", d.id))),
        ...oSnap.docs.map(d => deleteDoc(doc(db, "orders", d.id)))
      ];
      
      await Promise.all(allDeletes);
      setDbProducts([]);
      setOrders([]);
      
      setStatus('success');
      setMessage("Global database reset complete.");
    } catch (err) {
      setStatus('error');
      setMessage("Wipe failed.");
    }
  };

  const startBulkDeleteCountdown = () => {
    if (!window.confirm("WARNING: This will wipe your ENTIRE live catalog. Are you sure?")) return;
    setBulkDeleteCountdown(2);
    const timer = setInterval(() => {
      setBulkDeleteCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          if (prev === 1) clearLiveCatalog();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startIndividualDelete = (product: any) => {
    setIndividualDeleteCountdown(product);
  };

  const handleIndividualDelete = async (product: any) => {
    const { id, name, price, type, image, images } = product;
    // Save current state for rollback
    const previousProducts = [...dbProducts];
    
    // Optimistic update
    setDbProducts(current => current.filter(p => p.id !== id));
    
    try {
      // 1. Delete from Firestore
      await deleteDoc(doc(db, "products", id));
      
      // 2. Cleanup Storage if applicable
      const cleanupStorage = async (url: string) => {
        if (!url) return;
        
        // Supabase App-Files bucket cleanup
        if (!url.startsWith('http') && !url.startsWith('data:') && !url.startsWith('blob:')) {
          try {
             const { deleteFileFromStorage } = await import('../services/storageService');
             await deleteFileFromStorage(url);
          } catch (e) {
             console.error("Supabase Storage cleanup failed:", e);
          }
        }
        
        // Firebase Storage cleanup
        if (url.includes('firebasestorage.googleapis.com')) {
          try {
            // Extract path from storage URL
            const decodedUrl = decodeURIComponent(url);
            const pathStart = decodedUrl.indexOf('/o/') + 3;
            const pathEnd = decodedUrl.indexOf('?');
            const fullPath = decodedUrl.substring(pathStart, pathEnd === -1 ? undefined : pathEnd);
            const storageRef = ref(storage, fullPath);
            await deleteObject(storageRef);
            console.log(`Storage file deleted: ${fullPath}`);
          } catch (storageErr) {
            console.error("Storage cleanup failed (maybe already gone):", storageErr);
          }
        }
      };

      // Cleanup main image
      if (image) await cleanupStorage(image);
      // Cleanup gallery images
      if (images && Array.isArray(images)) {
        for (const imgUrl of images) {
           await cleanupStorage(imgUrl);
        }
      }
      // Cleanup color variant images
      if (product.colors && Array.isArray(product.colors)) {
        for (const color of product.colors) {
           if (color.image) await cleanupStorage(color.image);
        }
      }

      setMessage(`Product "${name}" and associated assets fully removed.`);
      setDeletedHistory(prev => [{
        id, 
        name, 
        price,
        type,
        time: new Date().toLocaleTimeString()
      }, ...prev].slice(0, 8));
      
      if (editingProduct?.id === id) setEditingProduct(null);
      setIndividualDeleteCountdown(null);
    } catch (err) {
      setDbProducts(previousProducts);
      setIndividualDeleteCountdown(null);
      try {
        handleFirestoreError(err, OperationType.DELETE, `products/${id}`);
      } catch (e: any) {
        const errData = JSON.parse(e.message);
        setMessage(`Error: ${errData.error}`);
      }
    }
  };


  if (authLoading || isAuthorized === null) return <div className="min-h-screen flex items-center justify-center bg-black"><Loader2 className="animate-spin text-brand-accent" /></div>;

  if (!isAuthorized) {
    return (
      <div className="max-w-4xl mx-auto py-32 px-6 text-center">
         <AlertCircle size={48} className="text-brand-accent mx-auto mb-6" />
         <h1 className="text-3xl font-display font-bold uppercase tracking-widest mb-4">Access Denied</h1>
         <p className="text-brand-metallic">This area is reserved for administrative personnel only.</p>
         <div className="flex flex-col items-center gap-4 mt-8">
           <Link to="/" className="text-xs font-bold uppercase tracking-widest border-b border-white pb-1">Back to Home</Link>
           {user?.email && SUPER_ADMINS.includes(user.email.toLowerCase()) && (
             <button onClick={seedSuperAdmin} className="text-[10px] text-brand-accent uppercase font-bold tracking-widest mt-4">Seed My Super Admin Status</button>
           )}
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-display font-bold uppercase tracking-tighter">Command Center</h1>
            <p className="text-brand-metallic text-xs uppercase tracking-widest mt-2">{user?.email}</p>
          </div>
          
          <div className="flex flex-wrap gap-2 items-center">
            {(activeTab === "products" || activeTab === "orders") && (
              <div className="flex items-center gap-2 mr-4 bg-white/5 border border-white/10 px-4 py-2 rounded-sm">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    autoRefresh ? "bg-green-500 animate-pulse" : "bg-white/20"
                  )} />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-brand-metallic">Auto-Sync (5m)</span>
                </div>
                <button 
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={cn(
                    "relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none",
                    autoRefresh ? "bg-brand-accent" : "bg-white/20"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-3 w-3 transform rounded-full bg-white transition-transform",
                      autoRefresh ? "translate-x-5" : "translate-x-1"
                    )}
                  />
                </button>
                {autoRefresh && (
                  <span className="text-[10px] font-mono text-brand-accent min-w-[12px]">{refreshCountdown}s</span>
                )}
                <div className="w-px h-4 bg-white/10 mx-2" />
                <button 
                  onClick={() => {
                    if (activeTab === "products") {
                      fetchProducts();
                      fetchCartCounts();
                    }
                    if (activeTab === "orders") fetchOrders();
                  }}
                  className="flex items-center gap-2 text-brand-metallic hover:text-white transition-colors"
                  title="Force Refresh"
                >
                  <RefreshCw size={14} className={cn(status === 'loading' && "animate-spin")} />
                  <span className="text-[8px] font-bold uppercase tracking-widest hidden sm:inline">Refresh Now</span>
                </button>
              </div>
            )}
            {activeTab === "products" && (
              <div className="flex gap-2 items-center mr-4">
                <button 
                  onClick={() => setIsAuthorized(false)} 
                  className="bg-white/5 border border-white/10 p-2 text-brand-metallic hover:text-white transition-all rounded-sm"
                  title="Secure Admin Access"
                >
                  <ShieldCheck size={14} />
                </button>
              </div>
            )}
            {(["dashboard", "orders", "products", "categories", "reviews", "customers", "admins", "media", "site", "security", "setup"] as AdminTab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-all border flex items-center gap-2",
                  activeTab === tab ? "bg-brand-accent border-brand-accent text-white shadow-lg shadow-brand-accent/20" : "border-white/10 text-brand-metallic hover:text-white"
                )}
              >
                {tab === "dashboard" && <LayoutGrid size={14} />}
                {tab === "orders" && <ShoppingBag size={14} />}
                {tab === "products" && <Package size={14} />}
                {tab === "categories" && <LayoutGrid size={14} />}
                {tab === "reviews" && <MessageCircle size={14} />}
                {tab === "customers" && <UserPlus size={14} />}
                {tab === "admins" && <Shield size={14} />}
                {tab === "media" && <Upload size={14} />}
                {tab === "site" && <Edit2 size={14} />}
                {tab === "security" && <ShieldCheck size={14} className="text-red-500" />}
                {tab === "setup" && <Settings size={14} />}
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Global Feedback Banner */}
        {message && (
          <div className={cn(
            "fixed top-6 left-1/2 -translate-x-1/2 z-[100] min-w-[300px] shadow-2xl p-4 border flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-300 backdrop-blur-md rounded-md",
            status === 'error' ? "bg-red-950/80 border-red-500/50 text-red-400" : "bg-black/90 border-brand-accent/50 text-brand-accent"
          )}>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                {status === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                <p className="text-[10px] font-bold uppercase tracking-widest">{message}</p>
              </div>
              <button onClick={() => setMessage("")} className="hover:opacity-70 transition-opacity ml-6 bg-white/10 rounded-full p-1">
                <X size={14} />
              </button>
            </div>
            
            {/* No upload progress bar per user request */}
          </div>
        )}

        {/* Dashboard Overview */}
        {activeTab === "dashboard" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-12">
              <div className="bg-white/5 border border-white/10 p-8 hover:border-brand-accent/50 transition-colors group">
                <Users className="text-brand-accent mb-4 group-hover:scale-110 transition-transform" size={24} />
                <h3 className="text-brand-metallic text-[10px] uppercase tracking-widest font-bold mb-2">Public Visitors</h3>
                <p className="text-3xl font-display font-bold">{analytics.uniqueVisits}</p>
                <div className="mt-4 flex gap-2 text-[9px] uppercase tracking-widest text-brand-metallic">
                  <span>{analytics.totalViews} TOTAL VIEWS</span>
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 p-8 hover:border-brand-accent/50 transition-colors group">
                <LineChart className="text-brand-accent mb-4 group-hover:scale-110 transition-transform" size={24} />
                <h3 className="text-brand-metallic text-[10px] uppercase tracking-widest font-bold mb-2">Total System Orders</h3>
                <p className="text-3xl font-display font-bold">LIVE</p>
                <button onClick={() => setActiveTab("orders")} className="mt-4 text-[9px] uppercase tracking-widest border-b border-brand-accent">View All</button>
              </div>
              <div className="bg-white/5 border border-white/10 p-8 hover:border-brand-accent/50 transition-colors group">
                <PackageCheck className="text-brand-accent mb-4 group-hover:scale-110 transition-transform" size={24} />
                <h3 className="text-brand-metallic text-[10px] uppercase tracking-widest font-bold mb-2">Product Catalog</h3>
                <p className="text-3xl font-display font-bold">{dbProducts.length || initialProducts.length}</p>
                <button onClick={() => setActiveTab("products")} className="mt-4 text-[9px] uppercase tracking-widest border-b border-brand-accent">Manage Catalog</button>
              </div>
              <div className="bg-white/5 border border-white/10 p-8 hover:border-brand-accent/50 transition-colors group relative">
                <LayoutGrid className="text-brand-accent mb-4 group-hover:scale-110 transition-transform" size={24} />
                <h3 className="text-brand-metallic text-[10px] uppercase tracking-widest font-bold mb-2">Categories</h3>
                <p className="text-3xl font-display font-bold">{categories.length}</p>
                <div className="flex gap-4 mt-4">
                  <button onClick={() => setActiveTab("categories")} className="text-[9px] uppercase tracking-widest border-b border-brand-accent">Manage Categories</button>
                  {categories.length > 0 && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        clearCategories();
                      }} 
                      className="text-[9px] uppercase tracking-widest text-red-500 hover:text-red-400"
                    >
                      Delete All
                    </button>
                  )}
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 p-8 hover:border-brand-accent/50 transition-colors group relative">
                <MessageCircle className="text-brand-accent mb-4 group-hover:scale-110 transition-transform" size={24} />
                <h3 className="text-brand-metallic text-[10px] uppercase tracking-widest font-bold mb-2">Customer Reviews</h3>
                <p className="text-3xl font-display font-bold">{reviews.length}</p>
                <div className="flex gap-4 mt-4">
                  <button onClick={() => setActiveTab("reviews")} className="text-[9px] uppercase tracking-widest border-b border-brand-accent">Moderate Reviews</button>
                </div>
              </div>
            </div>

            <AdminDashboardCharts customers={customers} />
          </>
        )}

        {/* Categories Management */}
        {activeTab === "categories" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-1">
              <div className="bg-white/5 border border-white/10 p-8 sticky top-28">
                <h2 className="text-xl font-bold uppercase tracking-tight mb-8 flex items-center gap-3">
                  <Plus size={20} className="text-brand-accent" />
                  {editingCategory ? "Update Details" : "Create New"}
                </h2>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    editingCategory ? handleUpdateCategory() : handleAddCategory(e);
                  }} 
                  className="space-y-6"
                >
                  <div>
                    <label className="text-[10px] text-brand-metallic uppercase tracking-widest font-bold block mb-2">Name</label>
                    <input 
                      required
                      type="text" 
                      value={editingCategory ? editingCategory.name : newCategory.name}
                      onChange={(e) => editingCategory 
                        ? setEditingCategory({...editingCategory, name: e.target.value}) 
                        : setNewCategory({...newCategory, name: e.target.value})}
                      placeholder="e.g. Helmets"
                      className="w-full bg-black border border-white/10 p-4 text-white text-sm" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-brand-metallic uppercase tracking-widest font-bold block mb-2">Slug (URL ID)</label>
                    <input 
                      type="text" 
                      value={editingCategory ? editingCategory.slug : newCategory.slug}
                      onChange={(e) => editingCategory 
                        ? setEditingCategory({...editingCategory, slug: e.target.value}) 
                        : setNewCategory({...newCategory, slug: e.target.value})}
                      placeholder="helmets"
                      className="w-full bg-black border border-white/10 p-4 text-white text-sm font-mono placeholder:opacity-30" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-brand-metallic uppercase tracking-widest font-bold block mb-2">Description</label>
                    <textarea 
                      rows={3}
                      value={editingCategory ? editingCategory.description : newCategory.description}
                      onChange={(e) => editingCategory 
                        ? setEditingCategory({...editingCategory, description: e.target.value}) 
                        : setNewCategory({...newCategory, description: e.target.value})}
                      className="w-full bg-black border border-white/10 p-4 text-white text-sm resize-none" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] text-brand-metallic uppercase tracking-widest font-bold block mb-2">Display Order</label>
                      <input 
                        type="number" 
                        value={editingCategory ? editingCategory.order : newCategory.order}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          const finalVal = isNaN(val) ? 0 : val;
                          editingCategory 
                            ? setEditingCategory({...editingCategory, order: finalVal}) 
                            : setNewCategory({...newCategory, order: finalVal});
                        }}
                        className="w-full bg-black border border-white/10 p-4 text-white text-sm font-mono" 
                      />
                    </div>
                      <div>
                         <ImageUpload 
                           onUploadComplete={(url) => editingCategory 
                             ? setEditingCategory({...editingCategory, image: url}) 
                             : setNewCategory({...newCategory, image: url})}
                           label="Category Icon"
                           featureName="categories"
                           itemId={editingCategory ? editingCategory.id : "new"}
                         />
                      </div>
                  </div>
                  
                   {((editingCategory?.image) || (newCategory.image)) && (
                     <>
                        <div className="h-20 w-20 border border-white/10 p-2 bg-white/5 overflow-hidden">
                          <StorageImage 
                            src={editingCategory ? editingCategory.image : newCategory.image} 
                            alt="Category Preview" 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                          />
                        </div>
                     </>
                   )}

                  <div className="pt-6 flex gap-2">
                    <button type="submit" className="flex-grow bg-brand-accent text-white py-4 font-bold uppercase tracking-widest text-xs">
                      {editingCategory ? "Update Category" : "Deploy Category"}
                    </button>
                    {editingCategory && (
                      <button 
                        type="button" 
                        onClick={() => setEditingCategory(null)}
                        className="bg-white/5 border border-white/10 text-white px-4 hover:bg-white/10"
                      >
                        <X size={20} />
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white/5 border border-white/10 p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold uppercase tracking-tight">Active Categories</h2>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => {
                        setNewCategory({
                          name: "Visor",
                          slug: "visor",
                          description: "Premium Helmets Visors & Accessories",
                          order: categories.length + 1,
                          image: ""
                        });
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-[8px] font-bold uppercase tracking-widest bg-brand-accent/10 text-brand-accent border border-brand-accent/20 px-3 py-1 hover:bg-brand-accent hover:text-white transition-all font-display"
                    >
                      Quick Add Visor
                    </button>
                    <button 
                      onClick={clearCategories}
                      className="text-[8px] font-bold uppercase tracking-widest bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-1 hover:bg-red-500 hover:text-white transition-all underline decoration-red-500/30"
                    >
                      Delete All
                    </button>
                    <p className="text-[10px] text-brand-metallic uppercase tracking-widest font-bold">Count: {categories.length}</p>
                    <button 
                      onClick={() => fetchCategories()}
                      className="text-brand-accent hover:text-white transition-colors"
                    >
                      <RefreshCw size={14} />
                    </button>
                  </div>
                </div>

                {categories.length === 0 ? (
                  <div className="py-20 text-center border border-dashed border-white/10">
                    <p className="text-brand-metallic uppercase text-xs tracking-widest font-bold">No custom categories found.</p>
                    <p className="text-[10px] text-white/40 uppercase mt-2">Create your first category on the left.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {categories.map(cat => (
                      <div key={cat.id} className="bg-black/40 border border-white/10 p-6 flex items-center justify-between group hover:border-brand-accent transition-colors relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-brand-accent/20 group-hover:bg-brand-accent transition-colors" />
                        <div className="flex items-center gap-4 overflow-hidden">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent text-[10px] font-bold">
                            {cat.order || 0}
                          </div>
                          <div className="flex-shrink-0 w-12 h-12 bg-white/5 flex items-center justify-center border border-white/5 overflow-hidden rounded-sm">
                            {cat.image ? (
                              <StorageImage 
                                src={cat.image} 
                                alt={cat.name} 
                                className="w-full h-full object-cover" 
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <LayoutGrid size={20} className="text-brand-metallic" />
                            )}
                          </div>
                          <div className="overflow-hidden">
                            <h3 className="font-bold uppercase text-sm tracking-tight truncate">{cat.name}</h3>
                            <p className="text-[10px] text-brand-metallic font-mono uppercase truncate mb-1">#/{cat.slug}</p>
                            {cat.description && (
                              <p className="text-[9px] text-white/40 italic truncate max-w-[200px]">{cat.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => {
                              setEditingCategory(cat);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="p-2 text-brand-accent hover:bg-brand-accent/10 border border-brand-accent/20 transition-all"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                             onClick={() => handleDeleteCategory(cat.id)}
                             className="px-3 py-2 text-red-500 hover:bg-red-600 hover:text-white border border-red-500/20 transition-all flex items-center gap-2"
                             title="Permanently Delete Category"
                          >
                            <Trash2 size={12} />
                            <span className="text-[8px] font-bold uppercase tracking-widest">Delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Visual Guide */}
                <div className="mt-12 p-6 bg-brand-accent/5 border border-brand-accent/20 flex gap-4">
                   <div className="w-12 h-12 flex-shrink-0 bg-brand-accent/10 rounded-full flex items-center justify-center text-brand-accent">
                      <Settings size={24} />
                   </div>
                   <div>
                      <h4 className="text-xs font-bold uppercase tracking-widest text-brand-accent mb-2">Category Strategy</h4>
                      <p className="text-[10px] text-brand-metallic leading-relaxed max-w-lg">
                        Categories help group your products. When adding a product, selectable types will include these dynamic categories. 
                        Changing a category name or slug will not break existing products, but you should update them manually if they lose their filter mapping.
                      </p>
                   </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Orders Management */}
        {activeTab === "orders" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold uppercase tracking-tight">System-Wide Orders</h2>
            {status === "loading" ? <Loader2 className="animate-spin text-brand-accent mx-auto" /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-[10px] uppercase tracking-widest text-brand-metallic">
                      <th className="py-4">ID</th>
                      <th className="py-4">Customer</th>
                      <th className="py-4">Amount</th>
                      <th className="py-4">Status</th>
                      <th className="py-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {orders?.map(order => (
                      <tr key={order.id} className="text-sm font-mono hover:bg-white/5 transition-colors group">
                        <td className="py-4 text-brand-accent font-bold">{order.id}</td>
                        <td className="py-4">
                          <p className="font-sans font-bold text-white uppercase text-xs">{order.shipping_info?.name}</p>
                          <p className="text-[10px] text-brand-metallic uppercase">{order.user_email || "Guest Order"}</p>
                        </td>
                        <td className="py-4 text-white">₹{order.total_amount?.toLocaleString()}</td>
                        <td className="py-4 text-[10px]">
                          <span className={cn(
                            "px-2 py-1 rounded-sm uppercase font-bold",
                            order.status === "Processing" ? "bg-yellow-500/20 text-yellow-500" :
                            order.status === "Shipped" ? "bg-blue-500/20 text-blue-500" :
                            "bg-green-500/20 text-green-500"
                          )}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-4 text-brand-metallic text-xs">
                          <div className="flex items-center justify-between">
                            {order.created_at?.seconds ? new Date(order.created_at.seconds * 1000).toLocaleDateString() : typeof order.created_at === 'string' ? order.created_at : ''}
                            <button 
                              onClick={() => handleDeleteOrder(order.id)}
                              className="opacity-0 group-hover:opacity-100 p-2 text-brand-metallic hover:text-red-500 transition-all ml-4"
                              title="Delete Order Record"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Products Management */}
        {activeTab === "products" && (
          <div className="space-y-12">
            <div className="bg-white/5 border border-white/10 p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold uppercase tracking-tight flex items-center gap-3">
                  <Plus size={20} className="text-brand-accent" />
                  Add New Product
                </h2>
                <button 
                  onClick={() => setActiveTab("categories")}
                  className="text-[9px] font-bold uppercase tracking-widest text-brand-accent hover:text-white transition-colors bg-brand-accent/10 border border-brand-accent/20 px-3 py-2 rounded-sm flex items-center gap-2"
                >
                  <LayoutGrid size={12} />
                  Manage Categories
                </button>
              </div>
              <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-1">
                  <ImageUpload 
                    onUploadComplete={(url) => setNewProduct({...newProduct, image: url})}
                    initialUrl={newProduct.image}
                    featureName="products"
                    itemId="new"
                  />
                </div>
                <div>
                  <label className="text-[8px] text-brand-metallic uppercase tracking-widest font-bold block mb-2">Item Name</label>
                  <input 
                    required
                    type="text" 
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                    placeholder="E.G. RPHA 1"
                    className="w-full bg-black border border-white/10 p-4 text-white text-sm" 
                  />
                </div>
                <div>
                  <label className="text-[8px] text-brand-metallic uppercase tracking-widest font-bold block mb-2">Compatible Model (Optional)</label>
                  <input 
                    type="text" 
                    value={newProduct.model}
                    onChange={(e) => setNewProduct({...newProduct, model: e.target.value})}
                    placeholder="E.G. Z900, ZX10R"
                    className="w-full bg-black border border-white/10 p-4 text-white text-sm" 
                  />
                </div>
                <div>
                  <label className="text-[8px] text-brand-metallic uppercase tracking-widest font-bold block mb-2">Category / Type</label>
                  <select 
                    value={newProduct.type}
                    onChange={(e) => setNewProduct({...newProduct, type: e.target.value})}
                    className="w-full bg-black border border-white/10 p-4 text-white text-sm"
                  >
                    <optgroup label="Dynamic Categories">
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Vehicles & Parts">
                      <option value="Motorcycles">Motorcycles</option>
                      <option value="Visor">Visor</option>
                      <option value="Full-face">Full-Face Helmet</option>
                      <option value="Off-road">Off-Road / MX Helmet</option>
                      <option value="Dual-sport">Dual-Sport / Adventure</option>
                    </optgroup>
                    <optgroup label="Riding Gear">
                      <option value="Suit">One-Piece Suit</option>
                      <option value="Jacket">Riding Jacket</option>
                      <option value="Pants">Riding Pants</option>
                      <option value="Boots">Riding Boots</option>
                      <option value="Gloves">Riding Gloves</option>
                    </optgroup>
                    <optgroup label="Other">
                      <option value="Accessory">Accessory</option>
                      <option value="Merchandise">Merchandise</option>
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label className="text-[8px] text-brand-metallic uppercase tracking-widest font-bold block mb-2">Publishing Status</label>
                  <select 
                    value={newProduct.status}
                    onChange={(e) => setNewProduct({...newProduct, status: e.target.value})}
                    className="w-full bg-black border border-white/10 p-4 text-white text-sm"
                  >
                    <option value="published">Published (Visible)</option>
                    <option value="draft">Draft (Invisible)</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div>
                  <label className="text-[8px] text-brand-metallic uppercase tracking-widest font-bold block mb-2">Market Price (₹)</label>
                  <input 
                    required
                    type="number" 
                    value={newProduct.price}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setNewProduct({...newProduct, price: isNaN(val) ? 0 : val});
                    }}
                    className="w-full bg-black border border-white/10 p-4 text-white text-sm" 
                  />
                </div>
                <div>
                  <label className="text-[8px] text-brand-metallic uppercase tracking-widest font-bold block mb-2">Inventory Stock</label>
                  <input 
                    required
                    type="number" 
                    value={newProduct.stock}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setNewProduct({...newProduct, stock: isNaN(val) ? 0 : val});
                    }}
                    className="w-full bg-black border border-white/10 p-4 text-white text-sm" 
                  />
                </div>
                <div className="md:col-span-4 bg-white/5 border border-white/10 p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-[10px] text-brand-accent uppercase tracking-widest font-bold">Variations & Sizes</label>
                    <div className="flex gap-2">
                       <button 
                         type="button"
                         onClick={() => setNewProduct({...newProduct, sizes: ['S', 'M', 'L', 'XL', 'XXL']})}
                         className="text-[8px] bg-white/10 hover:bg-white/20 px-3 py-1 rounded text-white font-bold uppercase transition-all"
                       >
                         Set Standard
                       </button>
                       <button 
                         type="button"
                         onClick={() => setNewProduct({...newProduct, sizes: ['30ml', '60ml', '120ml', '250ml']})}
                         className="text-[8px] bg-brand-accent/20 hover:bg-brand-accent/40 text-brand-accent px-3 py-1 rounded font-bold uppercase transition-all"
                       >
                         Set Liquid (ml)
                       </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {newProduct.sizes?.map((size, idx) => (
                      <div key={idx} className="flex items-center gap-1 bg-brand-accent/10 border border-brand-accent/30 px-3 py-1.5 rounded-sm">
                        <span className="text-[10px] text-white font-bold">{size}</span>
                        <button 
                          type="button"
                          onClick={() => {
                            const updated = [...newProduct.sizes];
                            updated.splice(idx, 1);
                            setNewProduct({...newProduct, sizes: updated});
                          }}
                          className="text-brand-accent hover:text-white"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                    <input 
                      type="text" 
                      placeholder="+ Add size (e.g. 500ml)"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = (e.currentTarget.value).trim();
                          if (val) {
                            setNewProduct({...newProduct, sizes: [...(newProduct.sizes || []), val]});
                            e.currentTarget.value = "";
                          }
                        }
                      }}
                      className="bg-black border border-white/10 px-3 py-1.5 text-[10px] text-white min-w-[150px] focus:border-brand-accent transition-colors"
                    />
                  </div>
                  <p className="text-[8px] text-brand-metallic mt-2 uppercase tracking-widest">TIP: Press Enter to add a custom size variation.</p>
                </div>
                <div className="md:col-span-3">
                  <label className="text-[8px] text-brand-metallic uppercase tracking-widest font-bold block mb-2">Product Description</label>
                  <textarea 
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                    placeholder="Describe the product details, safety features, material, etc."
                    rows={4}
                    className="w-full bg-black border border-white/10 p-4 text-white text-sm resize-none" 
                  />
                </div>
                { (newProduct.type === "Full-face" || newProduct.type === "Off-road") && (
                  <div className="md:col-span-1">
                    <label className="text-[8px] text-brand-accent uppercase tracking-widest font-bold block mb-2">Product Weight (Grams)</label>
                    <input 
                      type="text" 
                      value={newProduct.weight}
                      onChange={(e) => setNewProduct({...newProduct, weight: e.target.value})}
                      placeholder="E.G. 1350 ± 50g"
                      className="w-full bg-black border border-brand-accent/50 p-4 text-white text-sm" 
                    />
                  </div>
                )}
                <div className="md:col-span-4 space-y-4 mb-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
                    <label 
                      onClick={() => {
                        setStatus("idle");
                        setMessage("Please select exactly 5 photos .");
                      }}
                      className="text-[10px] text-brand-metallic uppercase tracking-widest font-bold cursor-pointer hover:text-brand-accent transition-colors"
                    >
                      Gallery Views
                    </label>
                    <div className="flex items-center gap-1.5 bg-black border border-white/10 p-1 rounded-sm self-start">
                      <button
                        type="button"
                        onClick={() => setNewProductUploadMode("single")}
                        className={cn(
                          "px-3 py-1 text-[8px] uppercase font-bold tracking-wider rounded-sm transition-all",
                          newProductUploadMode === "single"
                            ? "bg-brand-accent text-white"
                            : "text-brand-metallic hover:text-white"
                        )}
                      >
                        Single Slots
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewProductUploadMode("batch")}
                        className={cn(
                          "px-3 py-1 text-[8px] uppercase font-bold tracking-wider rounded-sm transition-all",
                          newProductUploadMode === "batch"
                            ? "bg-brand-accent text-white"
                            : "text-brand-metallic hover:text-white"
                        )}
                      >
                        Batch Upload (Multi-Select)
                      </button>
                    </div>
                  </div>

                  {newProductUploadMode === "batch" ? (
                    <MultiImageUpload
                      images={newProduct.images || []}
                      onImagesChange={(urls) => {
                        setNewProduct({ ...newProduct, images: urls });
                      }}
                      maxImages={10}
                      featureName="products"
                      itemId="new"
                      label="Select & Upload Multiple Images at Once"
                    />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {(newProduct.images || []).map((img, idx) => (
                        <div key={idx} className="flex flex-col gap-3 border border-white/5 p-3 rounded-sm relative bg-white/[0.01]">
                          <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-1">
                            <span className="text-[9px] uppercase font-bold tracking-widest text-brand-metallic">Slot {idx + 1}</span>
                            <button 
                              type="button"
                              onClick={() => {
                                const newImg = (newProduct.images || []).filter((_, i) => i !== idx);
                                setNewProduct({...newProduct, images: newImg});
                              }}
                              className="text-red-500 hover:text-red-400 p-1 flex items-center gap-1 text-[9px] uppercase font-bold tracking-wider transition-colors"
                              title="Remove this slot entirely"
                            >
                              <Trash2 size={11} /> Remove
                            </button>
                          </div>
                          <ImageUpload 
                            onUploadComplete={(url) => {
                              const newImg = [...(newProduct.images || [])];
                              newImg[idx] = url;
                              setNewProduct({...newProduct, images: newImg});
                            }}
                            label={`Image View {idx + 1}`}
                            initialUrl={img}
                            featureName="products"
                            itemId="new"
                          />
                          {img && (
                            <div className="h-40 w-full border border-white/10 overflow-hidden bg-white/5 flex items-center justify-center relative group">
                              <StorageImage 
                                src={img} 
                                alt={`View ${idx + 1}`} 
                                className="w-full h-full object-cover" 
                                referrerPolicy="no-referrer"
                              />
                              <button 
                                type="button"
                                onClick={() => {
                                  const newImg = [...(newProduct.images || [])];
                                  newImg[idx] = "";
                                  setNewProduct({...newProduct, images: newImg});
                                }}
                                className="absolute top-2 right-2 p-1 bg-yellow-600 hover:bg-yellow-500 text-white rounded-sm opacity-0 group-hover:opacity-100 transition-opacity z-10 text-[9px] uppercase font-bold px-1.5 py-0.5"
                                title="Clear image URL but keep slot"
                              >
                                Clear Image
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                      {(newProduct.images || []).length < 10 && (
                        <button 
                          type="button"
                          onClick={() => setNewProduct({...newProduct, images: [...(newProduct.images || []), ""]})}
                          className="flex h-[42px] items-center justify-center border border-dashed border-brand-accent/40 text-brand-metallic hover:text-white transition-all text-[9px] uppercase font-bold tracking-widest mt-6 animate-pulse"
                        >
                          <Plus size={14} className="mr-2" /> Add Image Slot
                        </button>
                      )}
                    </div>
                  )}
                </div>
                  <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <div className="flex-grow">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[8px] text-brand-metallic uppercase tracking-widest font-bold block">
                          Action Video URL
                        </label>
                      </div>
                      <div className="flex gap-2">
                          {newProduct.videoUrl && (
                            <button 
                              type="button"
                              onClick={async () => {
                                const win = window.open('', '_blank');
                                if (win) {
                                  const { getSignedImageUrl } = await import("../services/storageService");
                                  const urlToUse = await getSignedImageUrl(newProduct.videoUrl);
                                  const embedUrl = getEmbedUrl(urlToUse);
                                  const isEmbed = embedUrl && (
                                    embedUrl.includes('youtube.com') ||
                                    embedUrl.includes('youtu.be') ||
                                    embedUrl.includes('instagram.com') ||
                                    embedUrl.includes('/embed/')
                                  );
                                  win.document.write(`
                                    <body style="margin:0;background:black;display:flex;align-items:center;justify-center:center;height:100vh;">
                                      ${isEmbed 
                                        ? `<iframe src="${embedUrl}" width="100%" height="100%" frameborder="0" allowfullscreen></iframe>`
                                        : `<video src="${urlToUse}" controls width="100%" height="100%"></video>`
                                      }
                                    </body>
                                  `);
                                }
                              }}
                              className="text-[9px] bg-brand-accent/20 hover:bg-brand-accent/40 text-brand-accent px-2 py-0.5 rounded flex items-center gap-1 transition-all"
                            >
                              <PlayCircle size={10} />
                              <span>Preview</span>
                            </button>
                          )}
                        </div>
                      <div className="relative">
                        <input 
                          type="url" 
                          value={newProduct.videoUrl}
                          onChange={(e) => setNewProduct({...newProduct, videoUrl: e.target.value})}
                          placeholder="HTTPS://... (Instagram/MP4/Youtube/Dailymotion)"
                          className="w-full bg-black border border-white/10 p-4 text-white text-sm font-mono text-[10px]" 
                        />
                      </div>
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[8px] text-brand-metallic uppercase tracking-widest font-bold block">
                          PDF Catalog URL (Optional)
                        </label>
                      </div>
                      <div className="relative">
                        <input 
                          type="url" 
                          value={newProduct.pdfUrl}
                          onChange={(e) => setNewProduct({...newProduct, pdfUrl: e.target.value})}
                          placeholder="HTTPS://... (Product Manual PDF)"
                          className="w-full bg-black border border-white/10 p-4 text-white text-sm font-mono text-[10px]" 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Product Color Variants section starts here */}
                  <div className="md:col-span-4 border border-white/10 p-6 bg-white/[0.02] space-y-6 rounded-sm mb-6">
                    <div>
                      <h3 className="text-xs uppercase tracking-widest font-bold text-white mb-1">Product Color Variants</h3>
                      <p className="text-[10px] text-brand-metallic uppercase tracking-wider">Configure multiple color/graphic combinations and set a corresponding picture for each color.</p>
                    </div>

                    {/* Display current list of color variants */}
                    {newProduct.colors && newProduct.colors.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {newProduct.colors.map((color, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-black border border-white/10 rounded-sm group relative">
                            <div className="flex items-center gap-3 overflow-hidden">
                              <span 
                                className="w-5 h-5 rounded-full border border-white/20 shrink-0 block" 
                                style={{ backgroundColor: color.hex }}
                              />
                              <div className="overflow-hidden">
                                <p className="text-white text-xs font-medium truncate leading-tight">{color.name}</p>
                                <p className="text-[9px] text-brand-metallic font-mono">{color.hex}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              {color.image && (
                                <div className="w-8 h-8 rounded-sm bg-zinc-950 border border-white/10 overflow-hidden flex items-center justify-center">
                                  <StorageImage 
                                    src={color.image} 
                                    alt={color.name} 
                                    className="w-full h-full object-cover" 
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  const updatedColors = newProduct.colors.filter((_, i) => i !== index);
                                  setNewProduct({ ...newProduct, colors: updatedColors });
                                }}
                                className="text-brand-metallic hover:text-red-500 transition-colors p-1"
                                title="Remove Variant"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-zinc-500 italic uppercase tracking-wider">No color variants added yet. Add variants using the controls below.</p>
                    )}

                    {/* Add color variant inputs */}
                    <div className="border border-white/5 p-4 bg-black/40 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-[9px] text-brand-metallic uppercase tracking-widest font-bold block">Variant Name / Graphic Name</label>
                        <input
                          type="text"
                          value={tempColor.name}
                          onChange={(e) => setTempColor({ ...tempColor, name: e.target.value })}
                          placeholder="e.g. Spartan Metallic Blue"
                          className="w-full bg-black border border-white/10 p-3 text-white text-xs focus:border-brand-accent transition-colors"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] text-brand-metallic uppercase tracking-widest font-bold block">Hex / Color Picker</label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={tempColor.hex}
                            onChange={(e) => setTempColor({ ...tempColor, hex: e.target.value })}
                            className="w-10 h-10 bg-transparent border border-white/10 p-1 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={tempColor.hex}
                            onChange={(e) => setTempColor({ ...tempColor, hex: e.target.value })}
                            placeholder="#000000"
                            className="flex-grow bg-black border border-white/10 p-3 text-white font-mono text-xs focus:border-brand-accent uppercase"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[9px] text-brand-metallic uppercase tracking-widest font-bold block bg-transparent">Upload Variant Image</label>
                        </div>
                        <div className="flex gap-2 items-center">
                          <div className="flex-grow">
                            <ImageUpload
                              onUploadComplete={(url) => setTempColor({ ...tempColor, image: url })}
                              label="Upload"
                              featureName="products"
                              itemId="new-variant"
                            />
                          </div>
                          {tempColor.image && (
                            <div className="w-10 h-10 border border-white/20 overflow-hidden relative shrink-0">
                              <StorageImage 
                                src={tempColor.image} 
                                alt="Variant Preview" 
                                className="w-full h-full object-cover" 
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="md:col-span-4 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            if (!tempColor.name.trim()) {
                              alert("Please enter a variant name.");
                              return;
                            }
                            setNewProduct({
                              ...newProduct,
                              colors: [...(newProduct.colors || []), { 
                                name: tempColor.name.trim(), 
                                hex: tempColor.hex, 
                                image: tempColor.image || newProduct.image // fallback to main image if none is uploaded
                              }]
                            });
                            setTempColor({ name: "", hex: "#111827", image: "" });
                          }}
                          className="bg-brand-accent/20 hover:bg-brand-accent/40 border border-brand-accent/45 text-brand-accent px-6 py-2.5 font-bold uppercase tracking-widest text-[10px] transition-all"
                        >
                          Add Variant to Product
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button type="submit" className="bg-brand-accent text-white px-12 py-4 font-bold uppercase tracking-widest text-xs">
                      Deploy to Catalog
                    </button>
                  </div>
              </form>
            </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
        <div className="flex flex-col gap-2 flex-grow">
          <h2 className="text-xl font-bold uppercase tracking-tight">Inventory Operations</h2>
          {deletedHistory.length > 0 && (
            <div className="flex flex-col gap-2 bg-red-500/5 border border-red-500/10 p-4 rounded-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[8px] font-bold text-red-500 uppercase tracking-widest flex items-center gap-2">
                  <XCircle size={10} /> Administrative Delete Log (Session Only)
                </span>
                <button onClick={() => setDeletedHistory([])} className="text-[8px] text-brand-metallic hover:text-white uppercase tracking-widest">Clear Log</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {deletedHistory.map((item, idx) => (
                  <div key={idx} className="bg-black/40 border border-white/5 p-2 flex items-center justify-between group">
                    <div className="overflow-hidden">
                      <p className="text-[10px] text-white font-bold uppercase truncate">{item.name}</p>
                      <p className="text-[8px] text-brand-metallic font-mono">{item.id} | ₹{item.price.toLocaleString()}</p>
                    </div>
                    <span className="text-[8px] text-brand-metallic font-mono ml-4 opacity-40 group-hover:opacity-100 transition-opacity">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        {dbProducts.length > 0 && (
          <button 
            disabled={bulkDeleteCountdown !== null}
            onClick={startBulkDeleteCountdown}
            className={cn(
              "px-6 py-2 text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2",
              bulkDeleteCountdown !== null 
                ? "bg-red-600 text-white animate-pulse" 
                : "border border-red-600/30 text-red-500 hover:bg-red-600 hover:text-white"
            )}
          >
            {bulkDeleteCountdown !== null ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
            {bulkDeleteCountdown !== null ? `Deleting in ${bulkDeleteCountdown}s...` : "Bulk Clear Catalog"}
          </button>
        )}
      </div>
      
      {/* Individual Delete Confirmation Overlay */}
      {individualDeleteCountdown && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-300">
          <div className="bg-black border border-red-500 max-w-md w-full p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <Trash2 size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold uppercase tracking-tight text-white mb-2">Confirm Destruction</h3>
              <p className="text-[10px] text-brand-metallic uppercase tracking-widest font-bold mb-4">You are about to permanently erase:</p>
              
              <div className="bg-white/5 p-4 border border-white/10 space-y-2 mb-4">
                <p className="text-lg font-mono text-white leading-tight uppercase font-bold">{individualDeleteCountdown.name}</p>
                <div className="flex items-center justify-center gap-4 text-[10px] font-mono text-brand-metallic">
                  <span>ID: {individualDeleteCountdown.id}</span>
                  <span>TYPE: {individualDeleteCountdown.type}</span>
                  <span className="text-red-500">VAL: ₹{individualDeleteCountdown.price.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-red-500/10 border border-red-500/20 p-4">
               <p className="text-[10px] text-red-500 font-bold uppercase leading-relaxed">
                 WARNING: This action cannot be undone. All database records and associated media links for this SKU will be nullified immediately.
               </p>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setIndividualDeleteCountdown(null)}
                className="flex-1 border border-white/20 text-white p-4 font-bold uppercase tracking-widest text-xs hover:bg-white/5 transition-all"
              >
                Abort Operation
              </button>
              <button 
                onClick={() => handleIndividualDelete(individualDeleteCountdown)}
                className="flex-1 bg-red-600 text-white p-4 font-bold uppercase tracking-widest text-xs hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Trash2 size={14} />
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {dbProducts?.length === 0 && (
        <div className="bg-brand-accent/5 border border-dashed border-brand-accent/20 p-12 text-center mb-8">
          <p className="text-brand-metallic uppercase text-[10px] tracking-[0.2em] mb-4">Live Database is Empty</p>
          <button 
            onClick={seedProducts}
            className="px-8 py-3 bg-brand-accent text-white font-bold uppercase tracking-widest text-[10px] hover:bg-brand-accent/80 transition-all"
          >
            Import Initial Catalog
          </button>
        </div>
      )}

      {dbProducts?.length > 0 && (
        <div className="mb-6 relative">
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search live catalog by name, type or ID..."
            className="w-full bg-white/5 border border-white/10 p-4 text-white text-xs uppercase tracking-widest focus:border-brand-accent transition-colors"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-metallic hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {dbProducts
        ?.filter(p => 
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
          p.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.id.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .map(product => (
        <div key={product.id} className="bg-white/5 border border-white/10 p-6 transition-all hover:bg-white/10">
          {editingProduct?.id === product.id ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-1">
                <ImageUpload 
                  onUploadComplete={(url) => setEditingProduct({...editingProduct, image: url})}
                  initialUrl={editingProduct.image}
                  featureName="products"
                  itemId={editingProduct.id}
                />
                {editingProduct.image && (
                  <div className="mt-2 flex items-center justify-between gap-2 p-2 bg-black border border-white/10">
                    <div className="h-8 w-8 overflow-hidden rounded-sm bg-brand-black flex items-center justify-center">
                      <StorageImage 
                        src={editingProduct.image} 
                        alt="Hero" 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <p className="text-[8px] font-mono text-brand-metallic truncate flex-grow">{editingProduct.image}</p>
                    <button 
                      onClick={async () => {
                        if (editingProduct.image) {
                          const { deleteFileFromStorage } = await import('../services/storageService');
                          await deleteFileFromStorage(editingProduct.image).catch(() => {});
                        }
                        await updateDoc(doc(db, "products", editingProduct.id), { image: "" });
                        setEditingProduct({...editingProduct, image: ""});
                      }}
                      className="text-red-500 hover:text-red-400"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
              <div className="md:col-span-1">
                <label className="text-[8px] text-brand-metallic uppercase mb-2 block tracking-widest">Name</label>
                <input 
                  type="text" 
                  value={editingProduct.name || ""}
                  onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                  className="w-full bg-black border border-brand-accent p-3 text-white text-sm"
                />
              </div>
              <div className="md:col-span-1">
                <label className="text-[8px] text-brand-metallic uppercase mb-2 block tracking-widest">Compatible Model</label>
                <input 
                  type="text" 
                  value={editingProduct.model || ""}
                  onChange={(e) => setEditingProduct({...editingProduct, model: e.target.value})}
                  placeholder="E.G. Z900"
                  className="w-full bg-black border border-brand-accent p-3 text-white text-sm"
                />
              </div>
              <div className="md:col-span-1">
                <label className="text-[8px] text-brand-metallic uppercase mb-2 block tracking-widest">Market Price (₹)</label>
                <input 
                  type="number" 
                  value={editingProduct.price || 0}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setEditingProduct({...editingProduct, price: isNaN(val) ? 0 : val});
                  }}
                  className="w-full bg-black border border-brand-accent p-3 text-white text-sm font-mono"
                />
              </div>
              <div className="md:col-span-1">
                <label className="text-[8px] text-brand-metallic uppercase mb-2 block tracking-widest">Stock</label>
                <input 
                  type="number" 
                  value={editingProduct.stock || 0}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setEditingProduct({...editingProduct, stock: isNaN(val) ? 0 : val});
                  }}
                  className="w-full bg-black border border-brand-accent p-3 text-white text-sm font-mono"
                />
              </div>
              <div className="md:col-span-1">
                <label className="text-[8px] text-brand-metallic uppercase mb-2 block tracking-widest">Type</label>
                <select 
                  value={editingProduct.type || "Accessory"}
                  onChange={(e) => setEditingProduct({...editingProduct, type: e.target.value})}
                  className="w-full bg-black border border-brand-accent p-3 text-white text-sm"
                >
                  <optgroup label="Dynamic Categories">
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Vehicles & Parts">
                    <option value="Motorcycles">Motorcycles</option>
                    <option value="Visor">Visor</option>
                    <option value="Full-face">Full-Face Helmet</option>
                    <option value="Off-road">Off-Road / MX Helmet</option>
                    <option value="Dual-sport">Dual-Sport / Adventure</option>
                  </optgroup>
                  <optgroup label="Riding Gear">
                    <option value="Suit">One-Piece Suit</option>
                    <option value="Jacket">Riding Jacket</option>
                    <option value="Pants">Riding Pants</option>
                    <option value="Boots">Riding Boots</option>
                    <option value="Gloves">Riding Gloves</option>
                  </optgroup>
                  <optgroup label="Other">
                    <option value="Accessory">Accessory</option>
                    <option value="Merchandise">Merchandise</option>
                  </optgroup>
                </select>
              </div>
              <div className="md:col-span-1">
                <label className="text-[8px] text-brand-metallic uppercase mb-2 block tracking-widest">Status / Visibility</label>
                <select 
                  value={editingProduct.status || "published"}
                  onChange={(e) => setEditingProduct({...editingProduct, status: e.target.value})}
                  className="w-full bg-black border border-brand-accent p-3 text-white text-sm"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft (Hidden)</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="md:col-span-3">
                <label className="text-[8px] text-brand-metallic uppercase mb-2 block tracking-widest">Description</label>
                <textarea 
                  value={editingProduct.description || ""}
                  onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                  rows={3}
                  className="w-full bg-black border border-brand-accent p-3 text-white text-sm resize-none"
                />
              </div>
              { (editingProduct.type === "Full-face" || editingProduct.type === "Off-road") && (
                <div className="md:col-span-1">
                  <label className="text-[8px] text-brand-accent uppercase mb-2 block tracking-widest">Product Weight</label>
                  <input 
                    type="text" 
                    value={editingProduct.weight || ""}
                    onChange={(e) => setEditingProduct({...editingProduct, weight: e.target.value})}
                    placeholder="E.G. 1400g"
                    className="w-full bg-black border border-brand-accent p-3 text-white text-sm"
                  />
                </div>
              )}
              
              <div className="md:col-span-4 bg-brand-accent/5 border border-brand-accent/20 p-6 my-4">
                <div className="flex items-center justify-between mb-4">
                  <label className="text-[10px] text-brand-accent uppercase tracking-widest font-bold">Active Variations (Sizes)</label>
                  <div className="flex gap-2">
                     <button 
                       type="button"
                       onClick={() => setEditingProduct({...editingProduct, sizes: ['S', 'M', 'L', 'XL', 'XXL']})}
                       className="text-[8px] bg-white/10 hover:bg-white/20 px-3 py-1 rounded text-white font-bold uppercase transition-all"
                     >
                       Standard Preset
                     </button>
                     <button 
                       type="button"
                       onClick={() => setEditingProduct({...editingProduct, sizes: ['30ml', '60ml', '120ml']})}
                       className="text-[8px] bg-brand-accent/20 hover:bg-brand-accent/40 text-brand-accent px-3 py-1 rounded font-bold uppercase transition-all"
                     >
                       Set ml (Anti-Fog)
                     </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(editingProduct.sizes || []).map((size: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-1 bg-brand-accent/10 border border-brand-accent/30 px-3 py-1.5 rounded-sm">
                      <span className="text-[10px] text-white font-bold">{size}</span>
                      <button 
                        type="button"
                        onClick={() => {
                          const updated = [...(editingProduct.sizes || [])];
                          updated.splice(idx, 1);
                          setEditingProduct({...editingProduct, sizes: updated});
                        }}
                        className="text-brand-accent hover:text-white"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                  <input 
                    type="text" 
                    placeholder="+ Add custom size"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = (e.currentTarget.value).trim();
                        if (val) {
                          setEditingProduct({...editingProduct, sizes: [...(editingProduct.sizes || []), val]});
                          e.currentTarget.value = "";
                        }
                      }
                    }}
                    className="bg-black border border-white/10 px-3 py-1.5 text-[10px] text-white min-w-[150px] focus:border-brand-accent transition-colors"
                  />
                </div>
              </div>

              <div className="md:col-span-1 flex items-end">
                <div className="flex gap-2 w-full">
                  <button onClick={handleUpdateProduct} className="flex-grow py-3 bg-green-500 text-black hover:bg-green-400 font-bold uppercase tracking-widest text-[10px]">Save</button>
                  <button 
                    onClick={() => startIndividualDelete(editingProduct)} 
                    disabled={individualDeleteCountdown?.id === editingProduct.id}
                    className={cn(
                      "p-3 transition-all",
                      individualDeleteCountdown?.id === editingProduct.id 
                        ? "bg-red-600 text-white animate-pulse" 
                        : "bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white"
                    )}
                  >
                    {individualDeleteCountdown?.id === editingProduct.id ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Trash2 size={18} />
                    )}
                  </button>
                  <button onClick={() => setEditingProduct(null)} className="p-3 bg-white/10 text-white"><X size={18} /></button>
                </div>
              </div>
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <PlayCircle size={12} className="text-brand-accent" />
                    <label className="text-[8px] text-brand-metallic uppercase block tracking-widest">Video URL (Max 15s)</label>
                  </div>
                  <div className="flex gap-2">
                    {editingProduct.videoUrl && (
                      <button 
                        type="button"
                        onClick={async () => {
                          const win = window.open('', '_blank');
                          if (win) {
                            const { getSignedImageUrl } = await import("../services/storageService");
                            const urlToUse = await getSignedImageUrl(editingProduct.videoUrl);
                            const embedUrl = getEmbedUrl(urlToUse);
                            const isEmbed = embedUrl && (
                              embedUrl.includes('youtube.com') ||
                              embedUrl.includes('youtu.be') ||
                              embedUrl.includes('instagram.com') ||
                              embedUrl.includes('/embed/')
                            );
                            win.document.write(`
                              <body style="margin:0;background:black;display:flex;align-items:center;justify-center:center;height:100vh;">
                                ${isEmbed 
                                  ? `<iframe src="${embedUrl}" width="100%" height="100%" frameborder="0" allowfullscreen></iframe>`
                                  : `<video src="${urlToUse}" controls width="100%" height="100%"></video>`
                                }
                              </body>
                            `);
                          }
                        }}
                        className="text-[9px] bg-brand-accent/20 hover:bg-brand-accent/40 text-brand-accent px-2 py-0.5 rounded flex items-center gap-1 transition-all"
                      >
                        <PlayCircle size={10} />
                        <span>Preview Video</span>
                      </button>
                    )}
                  </div>
                </div>
                <div className="relative">
                  <input 
                    type="text" 
                    value={editingProduct.videoUrl || ""}
                    onChange={(e) => setEditingProduct({...editingProduct, videoUrl: e.target.value})}
                    placeholder="Video URL (Instagram/MP4/Youtube)"
                    className="w-full bg-black border border-brand-accent p-3 text-white text-[10px] font-mono"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText size={12} className="text-brand-accent" />
                    <label className="text-[8px] text-brand-metallic uppercase block tracking-widest">PDF URL (Documentation)</label>
                  </div>
                </div>
                <div className="relative">
                  <input 
                    type="text" 
                    value={editingProduct.pdfUrl || ""}
                    onChange={(e) => setEditingProduct({...editingProduct, pdfUrl: e.target.value})}
                    placeholder="PDF URL"
                    className="w-full bg-black border border-brand-accent p-3 text-white text-[10px] font-mono"
                  />
                </div>
              </div>
              <div className="md:col-span-4 space-y-4 mt-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
                  <label 
                    onClick={() => {
                      setStatus("idle");
                      setMessage("Please select exactly 5 photos .");
                    }}
                    className="text-[10px] text-brand-metallic uppercase block tracking-widest font-bold cursor-pointer hover:text-brand-accent transition-colors"
                  >
                    Gallery Views
                  </label>
                  <div className="flex items-center gap-1.5 bg-black border border-white/10 p-1 rounded-sm self-start">
                    <button
                      type="button"
                      onClick={() => setEditProductUploadMode("single")}
                      className={cn(
                        "px-3 py-1 text-[8px] uppercase font-bold tracking-wider rounded-sm transition-all",
                        editProductUploadMode === "single"
                          ? "bg-brand-accent text-white"
                          : "text-brand-metallic hover:text-white"
                      )}
                    >
                      Single Slots
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditProductUploadMode("batch")}
                      className={cn(
                        "px-3 py-1 text-[8px] uppercase font-bold tracking-wider rounded-sm transition-all",
                        editProductUploadMode === "batch"
                          ? "bg-brand-accent text-white"
                          : "text-brand-metallic hover:text-white"
                      )}
                    >
                      Batch Upload (Multi-Select)
                    </button>
                  </div>
                </div>

                {editProductUploadMode === "batch" ? (
                  <MultiImageUpload
                    images={editingProduct.images || []}
                    onImagesChange={async (urls) => {
                      await updateDoc(doc(db, "products", editingProduct.id), { images: urls });
                      setEditingProduct({ ...editingProduct, images: urls });
                    }}
                    maxImages={10}
                    featureName="products"
                    itemId={editingProduct.id}
                    label="Select & Upload Multiple Images at Once"
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(editingProduct.images || []).map((img: string, idx: number) => (
                      <div key={idx} className="flex flex-col gap-2 border border-white/5 p-3 rounded-sm relative bg-white/[0.01]">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-1">
                          <span className="text-[9px] uppercase font-bold tracking-widest text-brand-metallic">Slot {idx + 1}</span>
                          <button 
                            type="button"
                            onClick={async () => {
                              const newImages = (editingProduct.images || []).filter((_: any, i: number) => i !== idx);
                              if (img) {
                                const { deleteFileFromStorage } = await import('../services/storageService');
                                await deleteFileFromStorage(img).catch(() => {});
                              }
                              await updateDoc(doc(db, "products", editingProduct.id), { images: newImages });
                              setEditingProduct({...editingProduct, images: newImages});
                            }}
                            className="text-red-500 hover:text-red-400 p-1 flex items-center gap-1 text-[9px] uppercase font-bold tracking-wider transition-colors"
                            title="Remove this slot entirely"
                          >
                            <Trash2 size={11} /> Remove
                          </button>
                        </div>
                        <ImageUpload 
                          onUploadComplete={async (url) => {
                            const newImages = [...(editingProduct.images || [])];
                            newImages[idx] = url;
                            await updateDoc(doc(db, "products", editingProduct.id), { images: newImages });
                            setEditingProduct({...editingProduct, images: newImages});
                          }}
                          label={`Persp. ${idx + 1}`}
                          initialUrl={img}
                          featureName="products"
                          itemId={editingProduct.id}
                        />
                        {img && (
                          <div className="flex items-center justify-between gap-2 p-2 bg-black border border-white/10">
                            <div className="h-8 w-8 overflow-hidden rounded-sm bg-brand-black flex items-center justify-center">
                              <StorageImage 
                                src={img} 
                                alt={`P.${idx+1}`} 
                                className="w-full h-full object-cover" 
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <p className="text-[8px] font-mono text-brand-metallic truncate flex-grow italic">{img}</p>
                            <button 
                              type="button"
                              onClick={async () => {
                                const newImages = [...(editingProduct.images || [])];
                                newImages[idx] = "";
                                await updateDoc(doc(db, "products", editingProduct.id), { images: newImages });
                                setEditingProduct({...editingProduct, images: newImages});
                              }}
                              className="text-yellow-600 hover:text-yellow-500 p-1 text-[8px] uppercase font-bold"
                              title="Clear image URL but keep slot"
                            >
                              Clear
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    {(editingProduct.images || []).length < 10 && (
                      <button 
                        type="button"
                        onClick={async () => {
                          const newImages = [...(editingProduct.images || []), ""];
                          await updateDoc(doc(db, "products", editingProduct.id), { images: newImages });
                          setEditingProduct({...editingProduct, images: newImages});
                        }}
                        className="flex h-[42px] items-center justify-center border border-dashed border-brand-accent/40 text-brand-metallic hover:text-white transition-all text-[9px] uppercase font-bold tracking-widest mt-6 animate-pulse"
                      >
                        <Plus size={14} className="mr-2" /> Add Image Slot
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Product Color Variants section starts here for Edit form */}
              <div className="md:col-span-4 border border-white/10 p-6 bg-white/[0.02] space-y-6 rounded-sm mt-4">
                <div>
                  <h3 className="text-xs uppercase tracking-widest font-bold text-white mb-1">Product Color Variants</h3>
                  <p className="text-[10px] text-brand-metallic uppercase tracking-wider">Configure multiple color/graphic combinations and set a corresponding picture for each color.</p>
                </div>

                {/* Display current list of color variants */}
                {editingProduct.colors && editingProduct.colors.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {editingProduct.colors.map((color: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-black border border-white/10 rounded-sm group relative">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <span 
                            className="w-5 h-5 rounded-full border border-white/20 shrink-0 block" 
                            style={{ backgroundColor: color.hex }}
                          />
                          <div className="overflow-hidden">
                            <p className="text-white text-xs font-medium truncate leading-tight">{color.name}</p>
                            <p className="text-[9px] text-brand-metallic font-mono">{color.hex}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {color.image && (
                            <div className="w-8 h-8 rounded-sm bg-zinc-950 border border-white/10 overflow-hidden flex items-center justify-center">
                              <StorageImage 
                                src={color.image} 
                                alt={color.name} 
                                className="w-full h-full object-cover" 
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={async () => {
                              const updatedColors = editingProduct.colors.filter((_: any, i: number) => i !== index);
                              if (color.image) {
                                const { deleteFileFromStorage } = await import('../services/storageService');
                                await deleteFileFromStorage(color.image).catch(() => {});
                              }
                              await updateDoc(doc(db, "products", editingProduct.id), { colors: updatedColors });
                              setEditingProduct({ ...editingProduct, colors: updatedColors });
                            }}
                            className="text-brand-metallic hover:text-red-500 transition-colors p-1"
                            title="Remove Variant"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-zinc-500 italic uppercase tracking-wider">No color variants added yet. Add variants using the controls below.</p>
                )}

                {/* Add color variant inputs */}
                <div className="border border-white/5 p-4 bg-black/40 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[9px] text-brand-metallic uppercase tracking-widest font-bold block">Variant Name / Graphic Name</label>
                    <input
                      type="text"
                      value={tempColorEdit.name}
                      onChange={(e) => setTempColorEdit({ ...tempColorEdit, name: e.target.value })}
                      placeholder="e.g. Spartan Metallic Blue"
                      className="w-full bg-black border border-white/10 p-3 text-white text-xs focus:border-brand-accent transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] text-brand-metallic uppercase tracking-widest font-bold block">Hex / Color Picker</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={tempColorEdit.hex}
                        onChange={(e) => setTempColorEdit({ ...tempColorEdit, hex: e.target.value })}
                        className="w-10 h-10 bg-transparent border border-white/10 p-1 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={tempColorEdit.hex}
                        onChange={(e) => setTempColorEdit({ ...tempColorEdit, hex: e.target.value })}
                        placeholder="#000000"
                        className="flex-grow bg-black border border-white/10 p-3 text-white font-mono text-xs focus:border-brand-accent uppercase"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[9px] text-brand-metallic uppercase tracking-widest font-bold block bg-transparent">Upload Variant Image</label>
                    </div>
                    <div className="flex gap-2 items-center">
                      <div className="flex-grow">
                        <ImageUpload
                          onUploadComplete={(url) => setTempColorEdit({ ...tempColorEdit, image: url })}
                          label="Upload"
                          featureName="products"
                          itemId={editingProduct.id}
                        />
                      </div>
                      {tempColorEdit.image && (
                        <div className="w-10 h-10 border border-white/20 overflow-hidden relative shrink-0">
                          <StorageImage 
                            src={tempColorEdit.image} 
                            alt="Variant Preview" 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="md:col-span-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        if (!tempColorEdit.name.trim()) {
                          alert("Please enter a variant name.");
                          return;
                        }
                        setEditingProduct({
                          ...editingProduct,
                          colors: [...(editingProduct.colors || []), { 
                            name: tempColorEdit.name.trim(), 
                            hex: tempColorEdit.hex, 
                            image: tempColorEdit.image || editingProduct.image // fallback to main image
                          }]
                        });
                        setTempColorEdit({ name: "", hex: "#111827", image: "" });
                      }}
                      className="bg-brand-accent/20 hover:bg-brand-accent/40 border border-brand-accent/45 text-brand-accent px-6 py-2.5 font-bold uppercase tracking-widest text-[10px] transition-all"
                    >
                      Add Variant to Product
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                {product.image && (
                  <div className="w-16 h-16 bg-black flex items-center justify-center border border-white/5 overflow-hidden">
                    <StorageImage 
                      src={product.image} 
                      alt={product.name} 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold uppercase text-sm tracking-tight">{product.name}</h3>
                    <div className="flex items-center gap-1 bg-brand-accent/10 px-2 py-0.5 border border-brand-accent/20">
                      <Database size={8} className="text-brand-accent" />
                      <span className="text-[8px] text-brand-accent font-bold uppercase">{product.id}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Package size={10} className="text-brand-metallic" />
                    <p className="text-[10px] text-brand-metallic uppercase tracking-widest">{product.type}</p>
                    {product.videoUrl && (
                      <button 
                        onClick={async () => {
                          const win = window.open('', '_blank');
                          if (win) {
                            const { getSignedImageUrl } = await import("../services/storageService");
                            const urlToUse = await getSignedImageUrl(product.videoUrl);
                            const embedUrl = getEmbedUrl(urlToUse);
                            const isEmbed = embedUrl && (
                              embedUrl.includes('youtube.com') ||
                              embedUrl.includes('youtu.be') ||
                              embedUrl.includes('instagram.com') ||
                              embedUrl.includes('/embed/')
                            );
                            win.document.write(`
                              <body style="margin:0;background:black;display:flex;align-items:center;justify-center:center;height:100vh;">
                                ${isEmbed 
                                  ? `<iframe src="${embedUrl}" width="100%" height="100%" frameborder="0" allowfullscreen></iframe>`
                                  : `<video src="${urlToUse}" controls width="100%" height="100%"></video>`
                                }
                              </body>
                            `);
                          }
                        }}
                        className="flex items-center gap-1 bg-brand-accent/10 px-1.5 py-0.5 border border-brand-accent/20 ml-2 hover:bg-brand-accent/20 transition-colors"
                        title="Watch Video Asset"
                      >
                        <PlayCircle size={8} className="text-brand-accent" />
                        <span className="text-[7px] text-brand-accent font-bold uppercase">Watch Video</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-8">
                <div className="text-right">
                  <p className="text-[10px] text-brand-metallic uppercase tracking-widest mb-1 flex items-center justify-end gap-1">
                    <ShoppingCart size={10} className="text-brand-accent" />
                    In Carts
                  </p>
                  <p className="font-mono text-sm font-bold text-white">
                    {cartCounts[product.id] || 0} SAVED
                  </p>
                </div>
                <div className="text-right border-l border-white/5 pl-8 relative">
                  <p className="text-[10px] text-brand-metallic uppercase tracking-widest mb-1 flex items-center justify-end gap-1">
                    {product.stock > 10 ? <CheckCircle2 size={10} className="text-green-500" /> : product.stock > 0 ? <Loader2 size={10} className="text-yellow-500 animate-pulse" /> : <XCircle size={10} className="text-red-500" />}
                    Stock Level
                  </p>
                  <p className={`font-mono text-sm font-bold ${product.stock > 10 ? 'text-green-500' : product.stock > 0 ? 'text-yellow-500' : 'text-red-500'}`}>
                    {product.stock || 0} UNITS
                  </p>
                  {product.stock < 3 && (
                    <a
                      href={`https://wa.me/${siteSettings?.whatsappNumber || '918292908076'}?text=${encodeURIComponent(`⚠️ CRITICAL INVENTORY ALERT: Product "${product.name}" (ID: ${product.id}) has dropped to ${product.stock} units! Please restock immediately.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute top-full mt-2 right-0 bg-red-500/10 border border-red-500/50 text-red-500 text-[8px] font-bold uppercase tracking-widest px-2 py-1 rounded whitespace-nowrap hover:bg-red-500 hover:text-white transition-colors"
                    >
                      Notify Supplier via WhatsApp
                    </a>
                  )}
                </div>
                <div className="text-right border-l border-white/5 pl-8">
                  <p className="text-[10px] text-brand-metallic uppercase tracking-widest mb-1">Asset Value</p>
                  <p className="text-xl font-display font-bold">₹{product.price.toLocaleString()}</p>
                </div>
                <div className="flex gap-2 border-l border-white/5 pl-8">
                  <button onClick={() => setEditingProduct({...product})} className="p-3 text-brand-accent hover:bg-brand-accent/10 transition-all">
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => startIndividualDelete(product)}
                    disabled={individualDeleteCountdown?.id === product.id}
                    className={cn(
                       "p-3 transition-all",
                       individualDeleteCountdown?.id === product.id 
                        ? "text-red-500 animate-pulse" 
                        : "text-brand-metallic hover:text-red-500"
                    )}
                  >
                    {individualDeleteCountdown?.id === product.id ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Trash2 size={18} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

    </div>
  )}

        {/* Media Library */}
        {activeTab === "media" && (
          <div className="space-y-12">
            <div className="bg-white/5 border border-white/10 p-8">
              <h2 className="text-xl font-bold uppercase tracking-tight mb-8 flex items-center gap-3">
                <Upload size={20} className="text-brand-accent" />
                Asset Management
              </h2>
              <div className="grid grid-cols-1 gap-8">
                <div className="bg-white/5 border border-white/10 p-8">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-[10px] text-brand-metallic uppercase tracking-widest font-bold">Database Health Scan</h4>
                    {purgeStatus === 'idle' ? (
                      <button 
                        disabled={status === 'loading'}
                        onClick={scanForInvalidImages}
                        className="text-[9px] font-bold uppercase tracking-widest bg-white/5 border border-white/10 px-3 py-1 hover:bg-white/10 flex items-center gap-2"
                      >
                        {status === 'loading' ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} />}
                        Scan Broken Assets
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <span className="text-[9px] font-mono text-brand-accent uppercase">{invalidProducts.length} Issues Found</span>
                        <button 
                          onClick={() => {setPurgeStatus('idle'); setInvalidProducts([]);}}
                          className="text-[9px] font-bold uppercase text-brand-metallic hover:text-white"
                        >
                          Reset
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {purgeStatus === 'scanning' && (
                    <div className="flex flex-col items-center justify-center py-8 gap-4 border border-white/5 bg-black/20">
                      <Loader2 className="animate-spin text-brand-accent" size={24} />
                      <p className="text-[10px] text-brand-metallic uppercase tracking-[0.2em] animate-pulse">Analyzing Asset Availability...</p>
                    </div>
                  )}

                  {purgeStatus === 'done' && invalidProducts.length > 0 && (
                    <div className="mb-4 space-y-4">
                      <div className="p-4 bg-red-500/10 border border-red-500/20">
                        <p className="text-[10px] text-red-500 font-bold uppercase mb-4">Detected Broken Media Assets</p>
                        
                        <div className="flex flex-col gap-2 mb-4">
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <input 
                              type="radio" 
                              name="purge_mode" 
                              checked={purgeMode === 'cleanup_images'} 
                              onChange={() => setPurgeMode('cleanup_images')}
                              className="accent-brand-accent"
                            />
                            <span className="text-[9px] uppercase font-bold text-white group-hover:text-brand-accent transition-colors">Cleanup (Remove Broken links only)</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <input 
                              type="radio" 
                              name="purge_mode" 
                              checked={purgeMode === 'delete_product'} 
                              onChange={() => setPurgeMode('delete_product')}
                              className="accent-brand-accent"
                            />
                            <span className="text-[9px] uppercase font-bold text-white group-hover:text-brand-accent transition-colors">Nuclear (Delete entire product entries)</span>
                          </label>
                        </div>

                        <button 
                          onClick={handlePurgeInvalid}
                          className="w-full bg-red-600 text-white py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-red-700 transition-colors shadow-lg"
                        >
                          Execute {purgeMode === 'cleanup_images' ? 'Asset Cleanup' : 'Product Purge'}
                        </button>
                      </div>

                      <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2 custom-scrollbar border-t border-white/5 pt-4">
                        {invalidProducts.map(p => (
                          <div key={p.id} className="flex items-center justify-between bg-white/5 p-2 border border-white/5">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-mono text-white truncate max-w-[120px]">{p.name}</span>
                              <span className="text-[7px] text-brand-metallic uppercase">{p.collection}</span>
                            </div>
                            <div className="flex gap-1">
                              {p.mainBroken && <span className="bg-red-500 text-black text-[7px] font-bold px-1 rounded-sm">MAIN</span>}
                              {p.galleryBrokenIndices?.length > 0 && <span className="bg-orange-500 text-black text-[7px] font-bold px-1 rounded-sm">GALLERY({p.galleryBrokenIndices.length})</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {purgeStatus === 'done' && invalidProducts.length === 0 && (
                    <div className="py-4 text-center border border-green-500/10 bg-green-500/5">
                       <p className="text-[9px] text-green-500 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                         <CheckCircle2 size={12} /> All catalog assets validated
                       </p>
                    </div>
                  )}

                  <h4 className="text-[10px] text-brand-metallic uppercase tracking-widest font-bold mb-4">Database Sync Assets</h4>
                  <div className="grid grid-cols-4 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {dbProducts.map(p => (
                      <div key={p.id} className="aspect-square bg-black border border-white/5 overflow-hidden group/thumb relative flex items-center justify-center">
                        {p.image ? (
                          <StorageImage 
                            src={p.image} 
                            alt={p.name} 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span className="text-[8px] text-white/20 uppercase tracking-tighter">Asset</span>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 bg-brand-accent/20 transition-opacity pointer-events-none">
                          <span className="text-[6px] font-bold text-white uppercase">{p.id}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Customers Management */}
        {activeTab === "customers" && (
          <div className="space-y-12 animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h2 className="text-xl font-display font-bold uppercase tracking-widest text-white flex items-center gap-3">
                <UserPlus className="text-brand-accent" size={24} />
                Registered Customers Data
              </h2>
            </div>
            
            <div className="bg-brand-black/40 border border-white/5 overflow-hidden">
              {customers.length === 0 ? (
                <div className="p-8 text-center border-b border-white/5 last:border-0">
                  <p className="text-brand-metallic text-sm uppercase tracking-widest font-mono">No customers found.</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {customers.map(customer => (
                    <div key={customer.id} className="p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:bg-white/[0.02] transition-colors relative group">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center shrink-0 border border-white/5">
                          <UserPlus className="text-brand-metallic" size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="font-mono text-sm tracking-widest uppercase text-white truncate max-w-[200px] md:max-w-[300px]">
                              {customer.email}
                            </h3>
                            <div className="px-2 py-0.5 border border-brand-accent/30 bg-brand-accent/10 flex items-center gap-1.5 shrink-0">
                              <Shield size={10} className="text-brand-accent" />
                              <span className="text-[9px] text-brand-accent font-bold uppercase tracking-widest">
                                {customer.customer_id || customer.customerId || "N/A"}
                              </span>
                            </div>
                          </div>
                          
                          <div className="mt-2 text-[10px] uppercase font-mono tracking-widest text-brand-metallic">
                            Joined: {customer.created_at || customer.createdAt ? new Date((customer.created_at || customer.createdAt)?.seconds ? (customer.created_at || customer.createdAt).seconds * 1000 : (customer.created_at || customer.createdAt)).toLocaleString() : 'N/A'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2 md:gap-4 shrink-0">
                        <span className="text-[9px] uppercase tracking-widest font-bold border border-white/10 px-3 py-1 bg-white/5">
                          Last Seen: {customer.last_login || customer.lastLogin ? new Date((customer.last_login || customer.lastLogin)?.seconds ? (customer.last_login || customer.lastLogin).seconds * 1000 : (customer.last_login || customer.lastLogin)).toLocaleString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Admin Management */}
        {activeTab === "admins" && (
          <div className="space-y-12">
            <div className="bg-white/5 border border-white/10 p-8">
              <h2 className="text-xl font-bold uppercase tracking-tight mb-8 flex items-center gap-3">
                <UserPlus size={20} className="text-brand-accent" />
                Authorize New Gmail
              </h2>
              <form onSubmit={handleAddAdmin} className="flex flex-col md:flex-row gap-4">
                <input 
                  required
                  type="email" 
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="NEW-ADMIN@GMAIL.COM"
                  className="flex-grow bg-black border border-white/10 p-4 text-white text-sm font-mono" 
                />
                <button type="submit" className="bg-brand-accent text-white px-12 py-4 font-bold uppercase tracking-widest text-xs">
                  Grant Access
                </button>
              </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-brand-accent/5 border border-brand-accent/20 p-4 mb-4">
                <p className="text-[10px] text-brand-accent uppercase font-bold tracking-widest flex items-center gap-2">
                  <ShieldCheck size={14} /> Master Super Admins: {SUPER_ADMINS.join(", ")}
                </p>
              </div>
              {adminList?.map(admin => (
                <div key={admin.id} className="bg-white/5 border border-white/10 p-6 flex items-center justify-between">
                  <div>
                    <p className="font-mono text-sm text-white">{admin.email}</p>
                    <p className="text-[8px] text-brand-metallic uppercase tracking-widest mt-1">
                      Added by {admin.addedBy}
                    </p>
                  </div>
                  {!SUPER_ADMINS.includes(admin.email.toLowerCase()) && (
                    <button onClick={() => handleDeleteAdmin(admin.id)} className="p-2 text-brand-metallic hover:text-red-500 transition-all">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Site Settings */}
        {activeTab === "site" && siteSettings && (
          <div className="space-y-12">
            <div className="bg-white/5 border border-white/10 p-8">
              <h2 className="text-xl font-bold uppercase tracking-tight mb-8 flex items-center gap-3">
                <Settings size={20} className="text-brand-accent" />
                Site Customization
              </h2>
              
              <form onSubmit={handleUpdateSiteSettings} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Identity */}
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] text-brand-metallic uppercase tracking-widest font-bold block mb-2">Store Name</label>
                      <input 
                        required
                        type="text" 
                        value={siteSettings.siteName || ""}
                        onChange={(e) => setSiteSettings({...siteSettings, siteName: e.target.value})}
                        className="w-full bg-black border border-white/10 p-4 text-white text-sm" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-brand-metallic uppercase tracking-widest font-bold block mb-2">Website Access</label>
                      <select 
                        value={siteSettings.siteAccess || "public"}
                        onChange={(e) => setSiteSettings({...siteSettings, siteAccess: e.target.value})}
                        className="w-full bg-black border border-white/10 p-4 text-white text-sm focus:outline-none focus:border-brand-accent transition-colors"
                      >
                        <option value="public">Public (Everyone can access)</option>
                        <option value="members">Members Only (Must login to view site)</option>
                        <option value="maintenance">Maintenance Mode (Only Admins can access)</option>
                      </select>
                      <p className="mt-2 text-[10px] text-brand-metallic">Control who can access the store front-end.</p>
                    </div>
                    <div>
                      <label className="text-[10px] text-brand-metallic uppercase tracking-widest font-bold block mb-2">Store Logo (URL)</label>
                      <input 
                        type="text" 
                        value={siteSettings.logoImage || ""}
                        onChange={(e) => setSiteSettings({...siteSettings, logoImage: e.target.value})}
                        placeholder="Leave blank to use Store Name as text logo"
                        className="w-full bg-black border border-white/10 p-4 text-white text-sm" 
                      />
                      {siteSettings.logoImage && (
                        <div className="mt-2 h-16 w-32 border border-white/10 bg-black flex items-center justify-center p-2">
                          <StorageImage src={siteSettings.logoImage} alt="Logo Preview" className="max-h-full max-w-full object-contain" />
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-[10px] text-brand-metallic uppercase tracking-widest font-bold block mb-2">Theme Accent Color</label>
                      <div className="flex gap-4">
                        <input 
                          type="color" 
                          value={siteSettings.accentColor || "#000000"}
                          onChange={(e) => setSiteSettings({...siteSettings, accentColor: e.target.value})}
                          className="h-12 w-24 bg-transparent cursor-pointer"
                        />
                        <input 
                          type="text" 
                          value={siteSettings.accentColor || ""}
                          onChange={(e) => setSiteSettings({...siteSettings, accentColor: e.target.value})}
                          className="flex-grow bg-black border border-white/10 p-4 text-white text-sm font-mono" 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Hero Section */}
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] text-brand-metallic uppercase tracking-widest font-bold block mb-2">Hero Headline</label>
                      <input 
                        type="text" 
                        value={siteSettings.heroTitle || ""}
                        onChange={(e) => setSiteSettings({...siteSettings, heroTitle: e.target.value})}
                        className="w-full bg-black border border-white/10 p-4 text-white text-sm" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-brand-metallic uppercase tracking-widest font-bold block mb-2">Hero Subline</label>
                      <textarea 
                        rows={2}
                        value={siteSettings.heroSubtitle || ""}
                        onChange={(e) => setSiteSettings({...siteSettings, heroSubtitle: e.target.value})}
                        className="w-full bg-black border border-white/10 p-4 text-white text-sm resize-none" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-brand-metallic uppercase tracking-widest font-bold block mb-2">Hero Background Image</label>
                      <div className="space-y-4">
                        <div className="flex gap-4">
                          <input 
                            type="text" 
                            value={siteSettings.heroImage || ""}
                            onChange={(e) => setSiteSettings({...siteSettings, heroImage: e.target.value})}
                            className="flex-grow bg-black border border-white/10 p-4 text-white text-sm font-mono" 
                            placeholder="https://images.unsplash..."
                          />
                          <button 
                            type="button"
                            onClick={() => setShowHeroMediaPicker(!showHeroMediaPicker)}
                            className="bg-white/5 border border-white/10 px-6 uppercase text-[10px] font-bold tracking-widest hover:bg-white/10 transition-colors"
                          >
                            Browse Assets
                          </button>
                        </div>
                        
                        {showHeroMediaPicker && (
                          <div className="bg-black/50 border border-white/10 p-4 mt-4">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-[10px] text-brand-metallic uppercase tracking-widest font-bold">Select from Product Media</h4>
                              <button 
                                type="button"
                                onClick={() => setShowHeroMediaPicker(false)}
                                className="text-brand-metallic hover:text-white"
                              >
                                <X size={14} />
                              </button>
                            </div>
                            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                              {dbProducts.map(p => (
                                <button
                                  key={`hero-pick-${p.id}`}
                                  type="button"
                                  onClick={() => {
                                    setSiteSettings({...siteSettings, heroImage: p.image});
                                    setShowHeroMediaPicker(false);
                                  }}
                                  className={cn(
                                    "aspect-square bg-black border border-white/5 overflow-hidden group/pick relative hover:border-brand-accent transition-colors",
                                    siteSettings.heroImage === p.image && "border-brand-accent ring-1 ring-brand-accent"
                                  )}
                                >
                                  {p.image && <div className="w-full h-full bg-brand-black flex items-center justify-center border border-white/10 overflow-hidden">
                                     <StorageImage 
                                       src={p.image} 
                                       alt={p.name} 
                                       className="w-full h-full object-cover" 
                                       referrerPolicy="no-referrer"
                                     />
                                  </div>}
                                </button>
                              ))}
                              <div className="col-span-2">
                                <ImageUpload 
                                  onUploadComplete={(url) => {
                                    setSiteSettings({...siteSettings, heroImage: url});
                                    setShowHeroMediaPicker(false);
                                  }}
                                  featureName="site_settings"
                                  itemId="heroImage"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {siteSettings.heroImage && (
                          <div className="mt-4 relative aspect-[21/9] bg-brand-black border border-white/10 overflow-hidden">
                             <StorageImage 
                               src={siteSettings.heroImage} 
                               alt="Hero Preview" 
                               className="w-full h-full object-cover opacity-60" 
                               referrerPolicy="no-referrer"
                             />
                             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                               <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/50 bg-black/40 px-4 py-2">Hero Asset Active</span>
                             </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="text-[10px] text-brand-metallic uppercase tracking-widest font-bold block mb-2">Contact Email</label>
                    <input 
                      type="email" 
                      value={siteSettings.contactEmail || ""}
                      onChange={(e) => setSiteSettings({...siteSettings, contactEmail: e.target.value})}
                      className="w-full bg-black border border-white/10 p-4 text-white text-sm font-mono" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-brand-metallic uppercase tracking-widest font-bold block mb-2">Contact Phone</label>
                    <input 
                      type="text" 
                      value={siteSettings.contactPhone || ""}
                      onChange={(e) => setSiteSettings({...siteSettings, contactPhone: e.target.value})}
                      className="w-full bg-black border border-white/10 p-4 text-white text-sm font-mono" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="text-[10px] text-brand-metallic uppercase tracking-widest font-bold block mb-2">WhatsApp Order Number</label>
                    <input 
                      type="text" 
                      value={siteSettings.whatsappNumber || ""}
                      onChange={(e) => setSiteSettings({...siteSettings, whatsappNumber: e.target.value})}
                      className="w-full bg-black border border-white/10 p-4 text-white text-sm font-mono" 
                      placeholder="919876543210"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-brand-metallic uppercase tracking-widest font-bold block mb-2">Store Address</label>
                    <input 
                      type="text" 
                      value={siteSettings.address || ""}
                      onChange={(e) => setSiteSettings({...siteSettings, address: e.target.value})}
                      className="w-full bg-black border border-white/10 p-4 text-white text-sm" 
                      placeholder="Street, City, State, ZIP"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-brand-metallic uppercase tracking-widest font-bold block mb-2">Footer Description</label>
                  <textarea 
                    rows={3}
                    value={siteSettings.footerText || ""}
                    onChange={(e) => setSiteSettings({...siteSettings, footerText: e.target.value})}
                    className="w-full bg-black border border-white/10 p-4 text-white text-sm resize-none" 
                    placeholder="Short description for the footer..."
                  />
                </div>

                <div className="pt-8 border-t border-white/10">
                  <button 
                    type="submit"
                    className="bg-brand-accent text-white px-12 py-4 font-bold uppercase tracking-widest text-sm hover:scale-105 transition-transform shadow-lg shadow-brand-accent/20"
                  >
                    Save All Changes
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white/5 border border-white/10 p-8">
              <h2 className="text-xl font-bold uppercase tracking-tight mb-8 flex items-center gap-3">
                <LayoutGrid size={20} className="text-brand-accent" />
                Homepage Aesthetic Gallery
              </h2>
              
              <p className="text-brand-metallic text-[10px] uppercase tracking-widest font-bold mb-8 italic">
                Manage the high-impact images shown in the safety and innovation sections of your home page.
              </p>

              <form onSubmit={handleUpdateGallerySettings} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Top Wide Image */}
                  <div className="md:col-span-2 space-y-4">
                    <label className="text-[10px] text-brand-accent uppercase tracking-widest font-bold block">1. Wide Gallery Banner (Header Shot)</label>
                    <p className="text-[9px] text-brand-metallic uppercase">This high-impact image appears in the top-most wide section of the homepage.</p>
                    <div className="flex flex-col gap-4">
                      <div className="flex gap-4">
                        <div className="relative flex-grow">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20">
                            <LinkIcon size={14} />
                          </div>
                          <input 
                            required
                            type="text" 
                            placeholder="Cloud Image URL"
                            value={gallerySettings.wideImage}
                            onChange={(e) => setGallerySettings({...gallerySettings, wideImage: e.target.value})}
                            className="w-full bg-black border border-white/10 pl-10 pr-4 py-4 text-white text-xs font-mono focus:border-brand-accent transition-colors" 
                          />
                        </div>
                        <ImageUpload 
                          onUploadComplete={(url) => {
                            setGallerySettings({...gallerySettings, wideImage: url});
                            setMessage("Header shot updated");
                            setTimeout(() => setMessage(""), 3000);
                          }}
                          label="Upload Image"
                          featureName="site_settings"
                          itemId="gallery-wideImage"
                        />
                      </div>
                    </div>
                    
                    {gallerySettings.wideImage && (
                      <div className="aspect-[21/9] bg-black border border-white/10 overflow-hidden">
                        <StorageImage 
                          src={gallerySettings.wideImage} 
                          alt="Wide Feature" 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                  </div>

                  {/* Left Square */}
                  <div className="space-y-4">
                    <label className="text-[10px] text-brand-accent uppercase tracking-widest font-bold block">2. Left Grid Asset (Square)</label>
                    <p className="text-[9px] text-brand-metallic uppercase">Appears on the bottom left of the showroom grid.</p>
                    <div className="flex flex-col gap-4">
                      <div className="flex gap-4">
                        <div className="relative flex-grow">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20">
                            <LinkIcon size={14} />
                          </div>
                          <input 
                            required
                            type="text" 
                            placeholder="Cloud Image URL"
                            value={gallerySettings.squareImage1}
                            onChange={(e) => setGallerySettings({...gallerySettings, squareImage1: e.target.value})}
                            className="w-full bg-black border border-white/10 pl-10 pr-4 py-4 text-white text-xs font-mono focus:border-brand-accent transition-colors" 
                          />
                        </div>
                        <ImageUpload 
                          onUploadComplete={(url) => setGallerySettings({...gallerySettings, squareImage1: url})}
                          label="Upload"
                          featureName="site_settings"
                          itemId="gallery-squareImage1"
                        />
                      </div>
                    </div>
                    {gallerySettings.squareImage1 && (
                      <div className="aspect-square bg-black border border-white/10 overflow-hidden">
                        <StorageImage 
                          src={gallerySettings.squareImage1} 
                          alt="Square Feature 1" 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                  </div>

                  {/* Right Square */}
                  <div className="space-y-4">
                    <label className="text-[10px] text-brand-accent uppercase tracking-widest font-bold block">3. Right Grid Asset (Square)</label>
                    <p className="text-[9px] text-brand-metallic uppercase">Appears on the bottom right of the showroom grid.</p>
                    <div className="flex flex-col gap-4">
                      <div className="flex gap-4">
                        <div className="relative flex-grow">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20">
                            <LinkIcon size={14} />
                          </div>
                          <input 
                            required
                            type="text" 
                            placeholder="Cloud Image URL"
                            value={gallerySettings.squareImage2}
                            onChange={(e) => setGallerySettings({...gallerySettings, squareImage2: e.target.value})}
                            className="w-full bg-black border border-white/10 pl-10 pr-4 py-4 text-white text-xs font-mono focus:border-brand-accent transition-colors" 
                          />
                        </div>
                        <ImageUpload 
                          onUploadComplete={(url) => setGallerySettings({...gallerySettings, squareImage2: url})}
                          label="Upload"
                          featureName="site_settings"
                          itemId="gallery-squareImage2"
                        />
                      </div>
                    </div>
                    {gallerySettings.squareImage2 && (
                      <div className="aspect-square bg-black border border-white/10 overflow-hidden">
                        <StorageImage 
                          src={gallerySettings.squareImage2} 
                          alt="Square Feature 2" 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                  </div>

                  {/* Technical Scanning Image */}
                  <div className="md:col-span-2 space-y-4">
                    <label className="text-[10px] text-brand-accent uppercase tracking-widest font-bold block">4. Hardware Scanner Asset (Technical Section)</label>
                    <p className="text-[9px] text-brand-metallic uppercase">Background image for the animated technical safety scanner.</p>
                    <div className="flex flex-col gap-4">
                      <div className="flex gap-4">
                        <div className="relative flex-grow">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20">
                            <LinkIcon size={14} />
                          </div>
                          <input 
                            required
                            type="text" 
                            placeholder="Cloud Image URL"
                            value={gallerySettings.technicalImage}
                            onChange={(e) => setGallerySettings({...gallerySettings, technicalImage: e.target.value})}
                            className="w-full bg-black border border-white/10 pl-10 pr-4 py-4 text-white text-xs font-mono focus:border-brand-accent transition-colors" 
                          />
                        </div>
                        <ImageUpload 
                          onUploadComplete={(url) => setGallerySettings({...gallerySettings, technicalImage: url})}
                          label="Upload"
                          featureName="site_settings"
                          itemId="gallery-technicalImage"
                        />
                      </div>
                    </div>
                    {gallerySettings.technicalImage && (
                      <div className="aspect-video bg-brand-black border border-white/10 overflow-hidden">
                         <StorageImage 
                           src={gallerySettings.technicalImage} 
                           alt="Technical Scanner" 
                           className="w-full h-full object-cover opacity-60" 
                           referrerPolicy="no-referrer"
                         />
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-8 border-t border-white/10">
                  <button 
                    type="submit"
                    className="bg-brand-accent text-white px-12 py-4 font-bold uppercase tracking-widest text-sm hover:scale-105 transition-transform shadow-lg shadow-brand-accent/20"
                  >
                    Update Gallery Images
                  </button>
                </div>
              </form>
            </div>

            <AdminPromoUpload />
          </div>
        )}

        {/* Reviews Management */}
        {activeTab === "reviews" && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white/5 border border-white/10 p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6">
                <div>
                  <h2 className="text-3xl font-display font-medium uppercase tracking-tight text-white mb-2 italic">Product <span className="text-brand-accent">Reviews</span></h2>
                  <p className="text-brand-metallic text-[10px] uppercase tracking-widest font-bold">Moderate customer feedback, quality reports, and review images.</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-brand-metallic uppercase tracking-widest font-bold">Live Feed</span>
                    <span className="text-xl font-display font-bold text-white">{reviews.length} Submissions</span>
                  </div>
                  <button 
                    onClick={fetchReviews}
                    className="p-3 border border-white/10 text-brand-metallic hover:text-white hover:bg-brand-accent hover:border-brand-accent transition-all rounded-sm flex items-center justify-center"
                    title="Refresh Feed"
                  >
                    <RefreshCw size={16} className={status === "loading" ? "animate-spin" : ""} />
                  </button>
                </div>
              </div>

              {reviews.length === 0 ? (
                <div className="py-32 text-center border border-dashed border-white/10 bg-white/5">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6 text-brand-metallic">
                    <MessageCircle size={32} />
                  </div>
                  <p className="text-brand-metallic uppercase tracking-[0.2em] text-[10px] font-bold">No customer reviews detected in the system.</p>
                  <p className="text-brand-metallic/50 text-[9px] uppercase tracking-widest mt-2">Check back after your next major sale.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {reviews.map((review) => (
                    <div key={review.id} className="bg-brand-gray/20 border border-white/10 hover:border-brand-accent/50 transition-all flex flex-col group/card relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-brand-accent opacity-0 group-hover/card:opacity-100 transition-opacity" />
                      
                      <div className="p-8 flex flex-col h-full">
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-brand-accent font-display font-bold text-lg">
                              {(review.userName || "A")[0].toUpperCase()}
                            </div>
                            <div>
                              <h4 className="text-sm font-bold uppercase tracking-wider text-white truncate max-w-[140px]">{review.userName || "Anonymous Rider"}</h4>
                              <p className="text-[8px] text-brand-metallic uppercase tracking-[0.2em] font-medium mt-1">Ref: {review.id.substring(0, 8)}...</p>
                            </div>
                          </div>
                          <div className="flex gap-1 text-brand-accent">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={12} fill={i < review.rating ? "currentColor" : "none"} className={i < review.rating ? "" : "text-white/10"} />
                            ))}
                          </div>
                        </div>

                        <div className="mb-6 space-y-4">
                           <div className="flex items-center gap-2 bg-brand-accent/10 w-fit px-3 py-1 rounded-full border border-brand-accent/20">
                             <Package size={10} className="text-brand-accent" />
                             <span className="text-[9px] text-white uppercase font-bold tracking-widest">SKU: {review.productId}</span>
                             <Link to={`/product/${review.productId}`} className="text-brand-accent hover:text-white ml-2 transition-colors">
                               <Maximize2 size={10} />
                             </Link>
                           </div>
                           <div className="bg-black/60 p-5 border border-white/5 relative italic">
                             <div className="absolute -top-3 -left-1 text-4xl text-brand-accent/20 font-serif">"</div>
                             <p className="text-[13px] text-white/90 leading-relaxed font-medium relative z-10">
                               {review.comment || review.text}
                             </p>
                           </div>
                        </div>

                        {review.image && (
                          <div className={cn(
                            "relative aspect-square w-full mb-8 overflow-hidden rounded-sm bg-brand-black border transition-all",
                            review.isAdminReview ? "border-green-500/20" : "border-red-500/20"
                          )}>
                             <StorageImage 
                               src={review.image} 
                               alt="Customer Review" 
                               className="w-full h-full object-cover opacity-60" 
                               referrerPolicy="no-referrer"
                             />
                            
                            <div className="absolute top-3 left-3 z-20 flex flex-col gap-1">
                               {review.isAdminReview ? (
                                 <div className="flex items-center gap-1 bg-green-500 text-black text-[7px] font-bold px-2 py-0.5 uppercase tracking-tighter rounded-sm">
                                   <ShieldCheck size={8} /> Verified Asset
                                 </div>
                               ) : (
                                 <div className="flex items-center gap-1 bg-red-500 text-white text-[7px] font-bold px-2 py-0.5 uppercase tracking-tighter rounded-sm">
                                   <AlertCircle size={8} /> Hidden from Catalog
                                 </div>
                               )}
                            </div>

                            <div className="absolute inset-0 bg-brand-black/80 opacity-0 group-hover/img:opacity-100 transition-all flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm z-10">
                              <p className="text-[10px] text-brand-accent font-bold uppercase tracking-widest mb-4">Inspection Mode</p>
                              <div className="flex flex-col gap-2 w-full">
                                <button 
                                  onClick={() => window.open(review.image, '_blank')}
                                  className="bg-white text-brand-black px-6 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-brand-accent hover:text-white transition-all shadow-2xl flex items-center justify-center gap-2"
                                >
                                  <Maximize2 size={14} /> Full Resolution
                                </button>
                                
                                {!review.isAdminReview && (
                                  <button 
                                    onClick={() => handlePermitReviewImage(review.id)}
                                    className="bg-brand-accent text-white px-6 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-brand-black transition-all shadow-2xl flex items-center justify-center gap-2"
                                  >
                                    <Shield size={14} /> Permit for Site
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="mt-auto pt-6 border-t border-white/10 flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-[9px] text-brand-metallic uppercase tracking-widest font-bold">Submitted</span>
                            <span className="text-[10px] text-white font-mono">
                              {new Date(review.createdAt?.toDate?.() || Date.now()).toLocaleDateString('en-GB')}
                            </span>
                          </div>
                          <button 
                            onClick={() => handleDeleteReview(review.id)}
                            className="flex items-center gap-2 bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white px-5 py-3 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all border border-red-600/20 hover:border-red-600 active:scale-95"
                          >
                            <Trash2 size={14} /> Remove Review
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Security / Blocklist Management */}
        {activeTab === "security" && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-red-500/5 border border-red-500/20 p-8">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                  <Shield size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-display font-medium uppercase tracking-tight text-white mb-1">Security <span className="text-red-500">Protocol</span></h2>
                  <p className="text-brand-metallic text-[10px] uppercase tracking-widest font-bold">Manage permanent bans and investigate identity violations.</p>
                </div>
              </div>

              <div className="bg-black/40 border border-white/10 p-6 mb-12">
                <h3 className="text-xs font-bold uppercase tracking-widest text-white mb-6 flex items-center gap-2">
                  <UserPlus size={14} className="text-red-500" />
                  Manual Identity Quarantine
                </h3>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget as HTMLFormElement;
                    const uid = (form.elements.namedItem('uid') as HTMLInputElement).value;
                    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
                    const reason = (form.elements.namedItem('reason') as HTMLInputElement).value;
                    handleBlockUser(uid, email, reason);
                    form.reset();
                  }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                  <input required name="uid" placeholder="USER UID (FROM FIREBASE)" className="bg-black border border-white/10 p-4 text-white text-[10px] font-mono" />
                  <input required name="email" placeholder="USER EMAIL" className="bg-black border border-white/10 p-4 text-white text-[10px] font-mono" />
                  <input required name="reason" placeholder="REASON (E.G. UNAUTHORIZED UPLOAD)" className="bg-black border border-white/10 p-4 text-white text-[10px]" />
                  <button type="submit" className="md:col-span-3 bg-red-600 text-white py-4 font-bold uppercase tracking-widest text-xs hover:bg-red-700 transition-all">
                    Apply Permanent Identity Block
                  </button>
                </form>
              </div>

              <div className="space-y-4">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand-metallic mb-4 flex items-center gap-2">
                   <AlertCircle size={12} /> Blocked Identity Registry ({blockedUsers.length})
                </h3>
                {blockedUsers.length === 0 ? (
                  <div className="py-20 text-center border border-dashed border-white/5 bg-white/5 opacity-50">
                    <p className="text-[10px] text-brand-metallic uppercase tracking-[0.2em]">Registry Clear. No active bans detected.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {blockedUsers.map((u: any) => (
                      <div key={u.uid} className="bg-black/60 border border-red-500/20 p-6 flex items-center justify-between group">
                        <div className="flex gap-6 items-center">
                          <div className="w-10 h-10 rounded-full bg-red-600/10 flex items-center justify-center text-red-500">
                            <XCircle size={20} />
                          </div>
                          <div>
                            <div className="flex items-center gap-3">
                              <p className="font-mono text-sm text-white">{u.email}</p>
                              <span className="text-[8px] bg-red-500 text-white px-1.5 py-0.5 rounded-sm font-bold uppercase">PERMANENTLY BANNED</span>
                            </div>
                            <p className="text-[9px] text-red-500/80 uppercase tracking-widest mt-1 font-bold">Reason: {u.reason}</p>
                            <p className="text-[8px] text-brand-metallic font-mono mt-1">UID: {u.uid}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleUnblockUser(u.uid, u.type)}
                          className="text-[9px] font-bold uppercase tracking-widest text-brand-metallic hover:text-green-500 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          Lift Protocol
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Setup Utility */}
        {activeTab === "setup" && (
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 p-12 text-center">
              <div className="w-16 h-16 bg-brand-accent/10 text-brand-accent rounded-full flex items-center justify-center mx-auto mb-6">
                <Database size={32} />
              </div>
              <h2 className="text-xl font-bold uppercase tracking-tight mb-4">Initial Setup</h2>
              <p className="text-brand-metallic mb-8 max-w-lg mx-auto text-xs leading-relaxed">
                Run these once to prepare your store.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button 
                  onClick={seedProducts}
                  disabled={status === "loading"}
                  className="bg-brand-accent text-white px-8 py-4 font-bold uppercase tracking-widest text-[10px] hover:bg-brand-accent/80 transition-all"
                >
                  Seed Product Catalog
                </button>
                <button 
                  onClick={seedSuperAdmin}
                  disabled={status === "loading"}
                  className="bg-white/10 text-white px-8 py-4 font-bold uppercase tracking-widest text-[10px] hover:bg-white/20 transition-all font-display"
                >
                  Seed Super Admin
                </button>
                <button 
                  onClick={clearLiveCatalog}
                  disabled={status === "loading"}
                  className="bg-red-600/10 text-red-500 border border-red-600/20 px-8 py-4 font-bold uppercase tracking-widest text-[10px] hover:bg-red-600 hover:text-white transition-all font-display"
                >
                  Wipe Products
                </button>
                <button 
                  onClick={clearOrders}
                  disabled={status === "loading"}
                  className="bg-red-600/10 text-red-500 border border-red-600/20 px-8 py-4 font-bold uppercase tracking-widest text-[10px] hover:bg-red-600 hover:text-white transition-all font-display"
                >
                  Wipe Orders
                </button>
                <button 
                  onClick={clearCategories}
                  disabled={status === "loading"}
                  className="bg-red-600/10 text-red-500 border border-red-600/20 px-8 py-4 font-bold uppercase tracking-widest text-[10px] hover:bg-red-600 hover:text-white transition-all font-display"
                >
                  Wipe Categories
                </button>
                {user?.email && SUPER_ADMINS.includes(user.email.toLowerCase()) && (
                  <button 
                    onClick={wipeAllData}
                    disabled={status === "loading"}
                    className="bg-red-600 text-white px-8 py-4 font-bold uppercase tracking-widest text-[10px] hover:bg-red-700 transition-all font-display shadow-lg shadow-red-600/20"
                  >
                    Nuclear Wipe (All Data)
                  </button>
                )}
              </div>
              {status === "success" && <p className="mt-6 text-green-500 font-bold uppercase text-[9px] tracking-widest">{message}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
