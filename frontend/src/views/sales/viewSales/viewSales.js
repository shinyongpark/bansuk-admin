import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select';
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CNav,
  CNavItem,
  CNavLink,
  CCollapse,
  CFormSelect,
  CFormInput,
  CButton,
} from '@coreui/react';
import {
  CChartBar,
  CChartDoughnut,
  CChartLine,
  CChartPie,
  CChartPolarArea,
  CChartRadar,
} from '@coreui/react-chartjs'


const SalesDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [visibleTable, setVisibleTable] = useState(true);
  const [visibleLineChart, setVisibleLineChart] = useState(false);
  const years = Array.from(new Array(20), (val, index) => new Date().getFullYear() - index);
  const [userInput, setUserInput] = useState({
    year: years[0],
    month: 1,
    category: '',
  });
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://localhost:8080/get-categories');
      // const parsed = response.data.map(item => `${item.id}: ${item.name}`);
      const parsed = response.data.map(item => ({
        value: `${item.id}: ${item.name}`,
        label: `${item.id}: ${item.name}`,
      }));
      setCategories(parsed);
      // console.log("parsed list", parsed);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleChange = (e) => {
    if (e.hasOwnProperty('target')) {
      const { name, value } = e.target;
      setUserInput(prev => ({
        ...prev,
        [name]: value
      }));
    } else {
      userInput.category = e.value;
    }
  };

  const handleView = async (e) => {
    e.preventDefault()
    if (userInput.category == "") {
      alert('Please enter a valid category');
      return
    }
    try {
      const response = await axios.get(`http://localhost:8080/sales/orders?year=${userInput.year}&month=${userInput.month}`);
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CNav variant="tabs">
            <CNavItem>
              <CNavLink onClick={() => { setVisibleTable(true); setVisibleLineChart(false); }}>
                Table
              </CNavLink>
            </CNavItem>
            <CNavItem>
              <CNavLink onClick={() => { setVisibleTable(false); setVisibleLineChart(true); }}>
                Line Chart
              </CNavLink>
            </CNavItem>
          </CNav>
          <CCardHeader>
            <div className="d-flex align-items-center">
              <CFormSelect className="w-auto" name="year" onChange={handleChange}>
                {years.map(year => <option key={year} value={year}>{year}</option>)}
              </CFormSelect>
              <CFormSelect className="w-auto mx-2" name="month" onChange={handleChange}>
                {Array.from(new Array(12), (v, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
              </CFormSelect>
              <div className="w-auto mx-2" style={{ minWidth: '200px' }}>
                <Select
                  options={categories}  // Now using the transformed categories
                  name='category'
                  onChange={handleChange}
                  isSearchable={true}
                  placeholder="Select a category..."
                />
              </div>
              <CButton color="primary" type="button" onClick={handleView}>조회</CButton>
            </div>
          </CCardHeader>
          <CCollapse visible={visibleTable}>
            <CCardBody>
              <CTable hover>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell scope="col">제품명</CTableHeaderCell>
                    <CTableHeaderCell scope="col">자동분류명</CTableHeaderCell>
                    <CTableHeaderCell scope="col">상품 코드</CTableHeaderCell>
                    <CTableHeaderCell scope="col">공장</CTableHeaderCell>
                    <CTableHeaderCell scope="col">기존 원가</CTableHeaderCell>
                    <CTableHeaderCell scope="col">총액</CTableHeaderCell>
                    <CTableHeaderCell scope="col">최근 변경일</CTableHeaderCell>
                    <CTableHeaderCell scope="col">변경 원가</CTableHeaderCell>
                    <CTableHeaderCell scope="col">확인</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {orders.map(order => (
                    <CTableRow key={order._id}>
                      <CTableDataCell>{order.goods_name}</CTableDataCell>
                      <CTableDataCell>{order.comments}</CTableDataCell>
                      <CTableDataCell>{order.goods_uid}</CTableDataCell>
                      <CTableDataCell>{order.warehouse}</CTableDataCell>
                      <CTableDataCell>{order.supply_price}</CTableDataCell>
                      <CTableDataCell>{order.selling_price}</CTableDataCell>
                      <CTableDataCell>{order.mod_date}</CTableDataCell>
                      <CTableDataCell><CFormInput /></CTableDataCell>
                      <CTableDataCell>
                        <CButton color="primary" onClick={() => handleCostUpdate(order._id)}>Update</CButton>
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCollapse>
          <CCollapse visible={visibleLineChart}>
            <CCardBody>
              <CChartLine
                data={{
                  labels: Array.from(new Array(30), (_, i) => i + 1), // Assuming 30 days in a month for simplicity
                  datasets: [{
                    label: 'Daily Sales',
                    backgroundColor: '#f87979',
                    data: orders.map(order => order.goods_num), // Adjust as per actual data key for quantities
                  }],
                }}
                labels="days"
              />
            </CCardBody>
          </CCollapse>
        </CCard>
      </CCol>
    </CRow>
  );
};

export default SalesDashboard;