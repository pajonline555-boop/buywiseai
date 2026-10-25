export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { logSecurityEvent } from "@/lib/auth/roleMiddleware";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { Partner, PartnerCategory, PartnerStatus } from "@/lib/partners/types";

const VALID_CATEGORIES: PartnerCategory[] = [
  'Fashion',
  'Fashion & Clothing',
  'Undergarments & Lingerie',
  'Jewellery',
  'Home & Living',
  'Electronics',
  'Mobiles & Smartphones',
  'Audio & Headphones',
  'Beauty & Personal Care',
  'E-Commerce & Retail',
  'Local Brands',
  'Exclusive Offers'
];

const VALID_STATUSES: PartnerStatus[] = ['APPROVED', 'PENDING', 'UNDER_REVIEW', 'SUSPENDED', 'REJECTED'];

export async function POST(request: NextRequest) {
  // 1. Strict Server-Authoritative Admin Authorization Check
  const auth = await requireAdmin(request);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const body = await request.json();
    const { action } = body;

    // ACTION 1: GRANT / CREATE / UPDATE PARTNER PERMISSION
    if (action === 'GRANT_PERMISSION') {
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
      const brandName = typeof body.brandName === 'string' ? body.brandName.trim() : '';
      const companyName = typeof body.companyName === 'string' ? body.companyName.trim() : brandName;
      const category: PartnerCategory = body.category || 'Fashion';
      const commissionValue = Number(body.commissionValue);
      const status: PartnerStatus = body.status || 'APPROVED';
      const phone = typeof body.phone === 'string' ? body.phone.trim() : '+91 9876543210';
      const city = typeof body.city === 'string' ? body.city.trim() : 'Surat';
      const state = typeof body.state === 'string' ? body.state.trim() : 'Gujarat';
      const pincode = typeof body.pincode === 'string' ? body.pincode.trim() : '395003';
      const gstNumber = typeof body.gstNumber === 'string' && body.gstNumber.trim().length > 0 ? body.gstNumber.trim().toUpperCase() : undefined;
      const partnerId = typeof body.partnerId === 'string' && body.partnerId.trim().length > 0 ? body.partnerId.trim() : undefined;

      // VALIDATION 1: Email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        return NextResponse.json(
          { success: false, code: 'INVALID_EMAIL', message: 'A valid merchant email address is required.' },
          { status: 400 }
        );
      }

      // VALIDATION 2: Brand / Store Name
      if (!brandName || brandName.length < 2) {
        return NextResponse.json(
          { success: false, code: 'INVALID_BRAND', message: 'Brand or Store name must be at least 2 characters.' },
          { status: 400 }
        );
      }

      // VALIDATION 3: Platform Commission limits (0% to 50%)
      if (isNaN(commissionValue) || commissionValue < 0 || commissionValue > 50) {
        return NextResponse.json(
          { success: false, code: 'INVALID_COMMISSION', message: 'Platform commission rate must be between 0% and 50%.' },
          { status: 400 }
        );
      }

      // VALIDATION 4: Category
      if (!VALID_CATEGORIES.includes(category)) {
        return NextResponse.json(
          { success: false, code: 'INVALID_CATEGORY', message: `Invalid store category: "${category}".` },
          { status: 400 }
        );
      }

      // VALIDATION 5: Status
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json(
          { success: false, code: 'INVALID_STATUS', message: `Invalid partner status: "${status}".` },
          { status: 400 }
        );
      }

      // VALIDATION 6: GSTIN format if provided
      if (gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstNumber)) {
        return NextResponse.json(
          { success: false, code: 'INVALID_GSTIN', message: 'Invalid Indian GSTIN tax identification number format.' },
          { status: 400 }
        );
      }

      // Check duplicate email under different partnerId
      const normalizedId = partnerId || `partner_${brandName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString(36)}`;
      const timestamp = new Date().toISOString();

      const newPartner: Partner = {
        id: normalizedId,
        brandName,
        companyName,
        email,
        phone,
        category,
        gstNumber,
        address: 'Registered Partner Office',
        city,
        state,
        pincode,
        status,
        commissionType: 'PERCENTAGE',
        commissionValue,
        totalProducts: 0,
        totalOrders: 0,
        totalRevenue: 0,
        buywiseCommissionEarned: 0,
        netPayable: 0,
        createdAt: timestamp,
        updatedAt: timestamp
      };

      // Persist to Firestore server-side
      const firestoreData = Object.fromEntries(
        Object.entries(newPartner).filter(([_, v]) => v !== undefined)
      );
      await setDoc(doc(db, 'partners', normalizedId), firestoreData, { merge: true });

      logSecurityEvent({
        eventType: 'ROLE_CHANGE',
        userId: auth.adminContext.uid,
        email: auth.adminContext.email,
        route: '/api/admin/partners',
        reason: `Admin granted partner selling permission to "${brandName}" (${email}) with status: ${status}, commission: ${commissionValue}%`
      });

      return NextResponse.json({
        success: true,
        partner: newPartner,
        message: `Partner selling permission granted to "${brandName}" with status ${status}!`
      });
    }

    // ACTION 2: UPDATE PARTNER PERMISSION STATUS (APPROVE / SUSPEND / REVOKE)
    if (action === 'UPDATE_STATUS') {
      const { partnerId, status } = body;
      if (!partnerId || typeof partnerId !== 'string') {
        return NextResponse.json({ success: false, code: 'MISSING_PARTNER_ID', message: 'Partner ID is required.' }, { status: 400 });
      }
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json({ success: false, code: 'INVALID_STATUS', message: `Invalid status: "${status}".` }, { status: 400 });
      }

      const timestamp = new Date().toISOString();
      await updateDoc(doc(db, 'partners', partnerId), {
        status,
        updatedAt: timestamp
      });

      logSecurityEvent({
        eventType: 'ROLE_CHANGE',
        userId: auth.adminContext.uid,
        email: auth.adminContext.email,
        route: '/api/admin/partners',
        reason: `Admin updated partner "${partnerId}" status to ${status}`
      });

      return NextResponse.json({
        success: true,
        partnerId,
        status,
        message: `Partner status successfully updated to ${status}.`
      });
    }

    // ACTION 3: UPDATE COMMISSION AGREEMENT
    if (action === 'UPDATE_COMMISSION') {
      const { partnerId, commissionValue } = body;
      const numComm = Number(commissionValue);
      if (!partnerId || isNaN(numComm) || numComm < 0 || numComm > 50) {
        return NextResponse.json({ success: false, code: 'INVALID_COMMISSION', message: 'Valid partnerId and commission between 0% and 50% required.' }, { status: 400 });
      }

      const timestamp = new Date().toISOString();
      await updateDoc(doc(db, 'partners', partnerId), {
        commissionValue: numComm,
        updatedAt: timestamp
      });

      logSecurityEvent({
        eventType: 'ROLE_CHANGE',
        userId: auth.adminContext.uid,
        email: auth.adminContext.email,
        route: '/api/admin/partners',
        reason: `Admin updated partner "${partnerId}" commission to ${numComm}%`
      });

      return NextResponse.json({
        success: true,
        partnerId,
        commissionValue: numComm
      });
    }

    return NextResponse.json({ success: false, code: 'INVALID_ACTION', message: 'Unknown or unsupported action.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, code: 'SERVER_ERROR', message: err.message || 'Internal server error.' }, { status: 500 });
  }
}
