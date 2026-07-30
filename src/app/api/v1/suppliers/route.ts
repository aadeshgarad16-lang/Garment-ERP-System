import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      company_name,
      contact_person,
      phone_mobile,
      email_address,
      registered_address,
      gstin_tax_id,
      payment_terms = "Net 30 Days",
      supply_capability
    } = body;

    // 1. Validate required fields
    if (!company_name || company_name.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'company_name is required and cannot be empty' },
        { status: 400 }
      );
    }
    if (!phone_mobile || phone_mobile.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'phone_mobile is required and cannot be empty' },
        { status: 400 }
      );
    }

    // 2. Extract supply capability
    const rawMaterials = supply_capability?.raw_materials || {};
    const finishedGoods = supply_capability?.finished_goods || {};

    const customRawMaterials = Array.isArray(rawMaterials.custom_tags)
      ? rawMaterials.custom_tags.join(',')
      : '';
    const customFinishedGoods = Array.isArray(finishedGoods.custom_tags)
      ? finishedGoods.custom_tags.join(',')
      : '';

    const supply_fabric = !!rawMaterials.supply_fabric;
    const supply_allied = !!rawMaterials.supply_allied;

    const supply_shirt = !!finishedGoods.supply_shirt;
    const supply_pant = !!finishedGoods.supply_pant;
    const supply_tshirt = !!finishedGoods.supply_tshirt;
    const supply_jacket = !!finishedGoods.supply_jacket;
    const supply_kurta = !!finishedGoods.supply_kurta;
    const supply_salwar = !!finishedGoods.supply_salwar;

    // 3. Insert into database
    const query = `
      INSERT INTO supplier_info (
        company_name,
        contact_person,
        phone_mobile,
        email_address,
        registered_address,
        gstin_tax_id,
        payment_terms,
        supply_fabric,
        supply_allied,
        custom_raw_materials,
        supply_shirt,
        supply_pant,
        supply_tshirt,
        supply_jacket,
        supply_kurta,
        supply_salwar,
        custom_finished_goods
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      company_name,
      contact_person || null,
      phone_mobile,
      email_address || null,
      registered_address || null,
      gstin_tax_id || null,
      payment_terms,
      supply_fabric,
      supply_allied,
      customRawMaterials,
      supply_shirt,
      supply_pant,
      supply_tshirt,
      supply_jacket,
      supply_kurta,
      supply_salwar,
      customFinishedGoods
    ];

    const [result] = await pool.execute<ResultSetHeader>(query, values);

    // 4. Return success response
    return NextResponse.json(
      {
        success: true,
        id: result.insertId,
        data: {
          id: result.insertId,
          company_name,
          contact_person,
          phone_mobile,
          email_address,
          registered_address,
          gstin_tax_id,
          payment_terms,
          supply_fabric,
          supply_allied,
          custom_raw_materials: customRawMaterials,
          supply_shirt,
          supply_pant,
          supply_tshirt,
          supply_jacket,
          supply_kurta,
          supply_salwar,
          custom_finished_goods: customFinishedGoods
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating supplier:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
