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
} from '@coreui/react';

const EditProduct = () => {
  const [productDetails, setProductDetails] = useState({
    code: '',
    importType: '',
    category: '',
    cate_id: '',
    factory: '',
    newProductName: '',
    newNickname: '',
    newComment: '',
    coupang: '',
    validation: '',
    description: '',
    deliveryFee: '',
    containerDeliveryFee: '',
    containerFee: '',
    rocket: '',
  });
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (productDetails.category) {
      fetchProducts(productDetails.category);
    }
  }, [productDetails.category]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('https://bs-admin.com:80/get-categories');
      console.log('Fetched categories:', response.data);
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "productCode") {
      // When a product code is selected, set the code and update other fields
      const selectedProduct = products.find(product => product.id === value);
      if (selectedProduct) {
        setProductDetails(prev => ({
          ...prev,
          code: selectedProduct.id,
          newProductName: selectedProduct.good_name,
          // Add other fields to auto-fill based on selected product
        }));
      }
    } else {
      setProductDetails(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
        ...(name === 'category' && { cate_id: value }),  // Automatically set cate_id when category changes
      }));
    }
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('https://bs-admin.com:80/edit-products', productDetails, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true
      });
      alert('Product updated successfully!');
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Failed to update the product');
    }
  };


  console.log()

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>제품 수정</strong>
          </CCardHeader>
          <CCardBody>
            <p className="text-body-secondary small">
              비활성시에는 제품 분류와 제품명을 선택 후 비활성화로 바꾸면 됩니다.
            </p>
            <CForm className="row g-3" onSubmit={handleSubmit}>
              <CCol md={2}>
                <CFormLabel>입고 구분</CFormLabel>
                <CFormCheck type="radio" name="importType" id="international" label="수입" value="international" onChange={handleChange} checked={productDetails.importType === 'international'} />
                <CFormCheck type="radio" name="importType" id="domestic" label="국내" value="domestic" onChange={handleChange} checked={productDetails.importType === 'domestic'} />
              </CCol>
              <CCol md={5}>
                <CFormLabel>카테고리</CFormLabel>
                <CFormSelect name="category" value={productDetails.category} onChange={handleChange}>
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>{category.id + ' ' + category.name}</option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol md={5}>
                <CFormLabel>제품 코드</CFormLabel>
                <CFormSelect name="productCode" value={productDetails.code} onChange={handleChange}>
                  <option value="">Select a category</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>{product.id}</option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol md={4}>
                <CFormLabel>제품명</CFormLabel>
                <CFormInput id="inputNewProdName" name="newProductName" placeholder="" value={productDetails.newProductName} onChange={handleChange} />
              </CCol>
              <CCol md={4}>
                <CFormLabel>공장명</CFormLabel>
                <CFormInput name="factory" placeholder="" value={productDetails.factory} onChange={handleChange} />
              </CCol>
              <CCol md={4}>
                <CFormLabel>자동분류명</CFormLabel>
                <CFormInput name="newNickname" placeholder="" value={productDetails.newNickname} onChange={handleChange} />
              </CCol>
              <CCol md={4}>
                <CFormLabel>비고</CFormLabel>
                <CFormInput name="newComment" placeholder="" value={productDetails.newComment} onChange={handleChange} />
              </CCol>
              <CCol md={2}>
                <CFormLabel>쿠팡</CFormLabel>
                <CFormInput name="coupang" placeholder="" value={productDetails.coupang} onChange={handleChange} />
              </CCol>
              <CCol md={2}>
                <CFormLabel>인증</CFormLabel>
                <CFormInput name="validation" placeholder="" value={productDetails.validation} onChange={handleChange} />
              </CCol>
              <CCol md={4}>
                <CFormLabel>제품 설명</CFormLabel>
                <CFormInput name="description" placeholder="" value={productDetails.description} onChange={handleChange} />
              </CCol>
              <CCol md={3}>
                <CFormLabel>택배 배송비</CFormLabel>
                <CFormInput name="deliveryFee" placeholder="" value={productDetails.deliveryFee} onChange={handleChange} />
              </CCol>
              <CCol md={3}>
                <CFormLabel>화물택배 배송비</CFormLabel>
                <CFormInput name="containerDeliveryFee" placeholder="" value={productDetails.containerDeliveryFee} onChange={handleChange} />
              </CCol>
              <CCol md={3}>
                <CFormLabel>화물 배송비</CFormLabel>
                <CFormInput name="containerFee" placeholder="" value={productDetails.containerFee} onChange={handleChange} />
              </CCol>
              <CCol md={3}>
                <CFormLabel>로켓 배송</CFormLabel>
                <CFormCheck
                  type="checkbox"
                  name="rocket"
                  checked={productDetails.rocket}
                  onChange={handleChange}
                />
              </CCol>

              <CCol xs={12}>
                <CButton color="primary" type="submit">확인</CButton>
              </CCol>
            </CForm>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default EditProduct
