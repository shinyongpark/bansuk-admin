import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormCheck,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CRow,
  CAlert,
} from '@coreui/react';

const RegisterProduct = () => {
  const [formData, setFormData] = useState({
    importType: '',
    category: '',
    productCode: '',
    productName: '',
    classification: '',
    good_alias: '',
    factoryName: '',
    description: '',
  });
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [errors, setErrors] = useState({ productCode: '' });

  useEffect(() => {
    fetchCategories();
    fetchProducts(); // Assuming this function now fetches all product codes
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('https://bs-admin.com:80/get-categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async (category) => {
    try {
      const response = await axios.get(`https://bs-admin.com:80/get-products?category=${category}`);
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const validateProductCode = (code, categoryCode) => {
    if (!code.startsWith(categoryCode)) {
      return 'Product code must start with the category code.';
    }
    if (products.includes(code)) {
      return 'Product code already exists.';
    }
    return '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let error = '';
    if (name === 'productCode') {
      error = validateProductCode(value, formData.category.slice(0, 3));
    }
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!errors.productCode) {
      try {
        await axios.post('https://bs-admin.com:80/add-product', formData, {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true
        });
        alert('Product registered successfully!');
      } catch (error) {
        console.error('Error registering product:', error);
        alert('Failed to register the product');
      }
    } else {
      alert('Please fix the errors before submitting.');
    }
  };

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>제품 등록</strong>
          </CCardHeader>
          <CCardBody>
            <p className="text-body-secondary small">
              제품코드 등록시, 기존 제품과 겹치지 않는지 확인 후 입력해주세요.
            </p>
            <CForm className="row g-3" onSubmit={handleSubmit}>
              <CCol md={2}>
                <CFormLabel>입고 구분</CFormLabel>
                <CFormCheck
                  type="radio"
                  name="importType"
                  id="incoming"
                  label="수입"
                  value="1"
                  onChange={handleChange}
                  checked={formData.importType === '1'}
                />
                <CFormCheck
                  type="radio"
                  name="importType"
                  id="outgoing"
                  label="국내"
                  value="0"
                  onChange={handleChange}
                  checked={formData.importType === '0'}
                />
              </CCol>
              <CCol md={2}>
                <CFormLabel>분류</CFormLabel>
                <CFormCheck
                  type="radio"
                  name="classification"
                  id="household"
                  label="가정용"
                  value="0"
                  onChange={handleChange}
                  checked={formData.classification === '0'}
                />
                <CFormCheck
                  type="radio"
                  name="classification"
                  id="gym"
                  label="클럽용"
                  value="1"
                  onChange={handleChange}
                  checked={formData.classification === '1'}
                />
              </CCol>
              <CCol md={4}>
                <CFormLabel>카테고리</CFormLabel>
                <CFormSelect name="category" value={formData.category} onChange={handleChange}>
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.id + ' ' + category.name}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol md={4}>
                <CFormLabel>제품 코드</CFormLabel>
                <CFormInput
                  name="productCode"
                  placeholder="00000.00"
                  value={formData.productCode}
                  onChange={handleChange}
                  invalid={!!errors.productCode}
                />
                {errors.productCode && <CAlert color="danger">{errors.productCode}</CAlert>}
              </CCol>
              <CCol md={4}>
                <CFormLabel>제품명</CFormLabel>
                <CFormInput
                  name="productName"
                  placeholder=""
                  value={formData.productName}
                  onChange={handleChange}
                />
              </CCol>
              <CCol md={4}>
                <CFormLabel>자동분류명</CFormLabel>
                <CFormInput
                  name="good_alias"
                  placeholder=""
                  value={formData.good_alias}
                  onChange={handleChange}
                />
              </CCol>
              <CCol md={4}>
                <CFormLabel>공장명</CFormLabel>
                <CFormInput
                  name="factoryName"
                  placeholder=""
                  value={formData.factoryName}
                  onChange={handleChange}
                />
              </CCol>
              <CCol md={4}>
                <CFormLabel>제품 설명</CFormLabel>
                <CFormInput
                  name="description"
                  placeholder=""
                  value={formData.description}
                  onChange={handleChange}
                />
              </CCol>
              <CCol xs={12}>
                <CButton color="primary" type="submit">
                  확인
                </CButton>
              </CCol>
            </CForm>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  );
};

export default RegisterProduct;
