import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CButton, CCard, CCardBody, CCardHeader, CCol, CFormSelect, CRow, CCollapse, CTable, CTableBody, CTableDataCell, CTableHead, CTableHeaderCell, CTableRow } from '@coreui/react';
import { CChartLine } from '@coreui/react-chartjs';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const SalesData = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [visibleTable, setVisibleTable] = useState(false);
  const [salesData, setSalesData] = useState([]);
  const [daysInMonth, setDaysInMonth] = useState(0);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://localhost:8080/get-categories');
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleView = async () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;
    const category = selectedCategory;
    if (!category) {
      alert('Please select a category');
      return;
    }
    try {
      const response = await axios.get(`http://localhost:8080/get-sales-data`, { params: { year, month, category } });
      setSalesData(response.data || []);
      setDaysInMonth(new Date(year, month, 0).getDate());
      setVisibleTable(true);
    } catch (error) {
      console.error('Failed to fetch sales data:', error);
    }
  };

  const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };  

  const getChartData = () => {
    const labels = Array.from({ length: daysInMonth }, (_, i) => i + 1); // Days of the month
    const datasets = salesData.map(product => {
      const productColor = getRandomColor(); // Assign a random color or use a color from a predefined set
      return {
        label: product.productName,
        backgroundColor: productColor,
        borderColor: productColor,
        fill: false,
        data: product.dailySales.map(sale => sale.count),
      };
    });
  
    return { labels, datasets };
  };  

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <div className="d-flex align-items-center">
              <DatePicker
                selected={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                dateFormat="yyyy-MM"
                showMonthYearPicker
              />
              <div className="w-auto mx-2" style={{ minWidth: '200px' }}>
                <CFormSelect name="category" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>{category.id + ' ' + category.name}</option>
                  ))}
                </CFormSelect>
              </div>
              <CButton color="primary" type="button" onClick={handleView}>조회</CButton>
            </div>
          </CCardHeader>
          <CCollapse visible={visibleTable}>
            <CCardBody>
              <CChartLine
                data={getChartData()}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: true,
                    },
                    tooltip: {
                      mode: 'index',
                      intersect: false,
                    },
                  },
                  scales: {
                    x: {  // Notice the change from 'xAxes' to 'x'
                      display: true,
                      title: {
                        display: true,
                        text: 'Day of the Month'
                      }
                    },
                    y: {  // Notice the change from 'yAxes' to 'y'
                      display: true,
                      title: {
                        display: true,
                        text: 'Sales Count'
                      }
                    }
                  }
                }}
              />

              <CTable hover>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell scope="col">제품명</CTableHeaderCell>
                    {Array.from({ length: daysInMonth }, (_, i) => <CTableHeaderCell key={i}>{i + 1}</CTableHeaderCell>)}
                    <CTableHeaderCell scope="col">총판매</CTableHeaderCell>
                    <CTableHeaderCell scope="col">재고</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {salesData.map((data, index) => (
                    <CTableRow key={index}>
                      <CTableDataCell>{data.productName}</CTableDataCell>
                      {data.dailySales.map((sale, idx) => (
                        <CTableDataCell key={idx}>{sale.count}</CTableDataCell>
                      ))}
                      <CTableDataCell>{data.totalSales}</CTableDataCell>
                      <CTableDataCell>{data.stock}</CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </CCardBody>

          </CCollapse>
        </CCard>
      </CCol>
    </CRow>
  );
};

export default SalesData;
