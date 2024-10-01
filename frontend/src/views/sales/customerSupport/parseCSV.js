export async function getDataFromFile(fileName, num, companies) {
    // console.log("getDataFromFile", fileName, num, companies);
    const orderCompanies = companies;
    const reader = new FileReader();
    const warehouseArray = ['반석창고', '옐로우캡창고'];
    const validPayMethod = ['신용', '착불']
    let data = [];
    let good_list = [];
    let Err_num = 0;
    let Err_str = '';
    let group_uid_temp = [0]; //pass by "reference"

    // Load the file content
    const fileContent = fileName;

    return new Promise((resolve, reject) => {
        reader.onload = function (event) {
            const content = event.target.result;
            const rows = content.split("\n");

            rows.forEach((row, index) => {
                const columns = row.split(",");

                // Skip empty rows or rows containing only whitespace
                if (columns.length === 0 || columns.every(col => col.trim() === "")) {
                    return;
                }

                // Helper function to safely get and trim values from columns
                const getValue = (index) => (columns[index] ? columns[index].trim() : '');
                let rowData = {};

                if (!checkDate(getValue(0))) {
                    Err_num++;
                    Err_str += `${index + 1}번째 날짜가 형식에 맞지 않습니다. ${getValue(0)}`;
                } else {
                    rowData['reg_date'] = new Date(rowData['reg_date']);
                }
                if (!orderCompanies.includes(getValue(1))) {
                    Err_num++;
                    Err_str += `${index + 1}번째 판매 회사 [ ${rowData['order_company']} ]가 없습니다. 다시 확인해주세요`;
                } else {
                    rowData['order_company'] = getValue(1);
                }
                rowData['receive_zip_code'] = formatZipCode(getValue(2));
                rowData['receive_address'] = getValue(3);
                rowData['receive_name'] = getValue(4);
                rowData['receive_tel1'] = formatPhone(getValue(5));
                rowData['receive_tel2'] = formatPhone(getValue(6));
                rowData['goods_num'] = getValue(7);
                rowData['delivery_cost'] = getValue(8);
                if (!validPayMethod.includes(getValue(9))) {
                    Err_num++;
                    Err_str += `${index + 1}번째 pay_method는 '신용' or '착불' 이어야 합니다.`;
                } else {
                    rowData['pay_method'] = getPayMethod(getValue(9));
                }

                rowData['comments'] = getValue(10).replace(/[\r\n'"]/g, '');
                rowData['invoice_number'] = getValue(11);
                rowData['supply_price'] = getValue(13);
                rowData['selling_price'] = getValue(14);
                rowData['settlement_price'] = getValue(15);
                rowData['goods_serial'] = getValue(16);
                rowData['order_serial'] = getValue(17);
                rowData['buyer_name'] = getValue(18);
                rowData['buyer_tel1'] = formatPhone(getValue(19));
                rowData['buyer_tel2'] = formatPhone(getValue(20));
                if (!warehouseArray.includes(getValue(21))) {
                    Err_num++;
                    Err_str += `${index + 1}번째 창고는 '반석창고' or '옐로우캡창고' 이어야 합니다.`;
                } else {
                    rowData['warehouse'] = getValue(21);
                }
                const checked_good_name = check_good_name_rule(rowData, group_uid_temp, getValue(12).replace(/\s/g, ''), good_list)
                if (!checked_good_name[0]) {
                    Err_num++;
                    Err_str += `${index + 1}번째 good_name을 확인해주세요: ${checked_good_name[1]}`;
                } else {
                    rowData['goods_name'] = getValue(12).replace(/\s/g, '');
                    rowData['group_uid'] = group_uid_temp[0];
                }

                data.push(rowData);
            });

            // Check for errors after processing all rows
            if (data.length !== Number(num)) {
                resolve([false, "총 주문수가 일치하지 않습니다"]); // Resolve with error message
            } else if (Err_num > 0) {
                resolve([false, Err_str]); // Resolve with error message
            } else {
                resolve([true, data]); // Resolve with processed data
            }
            return;
        };

        // Reject some other errs like no file etc. // "catch" later
        reader.onerror = function () {
            console.error("File read failed");
            reject([false, "파일을 읽는 중 오류가 발생했습니다."]);
        };

        // Start reading the file (asynchronously)
        reader.readAsText(fileContent, 'EUC-KR');

        // $this->grouping_goods();
        // check_data()
    });
}


/////// helper functions //////////////////////////////////////////////////////////////////////////////////
function checkDate(str) {
    const a = new Date(str);
    return !isNaN(a.getTime());
}

function formatZipCode(zip) {
    let newStr = zip.replace(/-/g, '');
    if (newStr.length === 6 && !isNaN(newStr)) {
        return `${newStr.substring(0, 3)}-${newStr.substring(3, 6)}`;
    }
    return '';
}

function formatPhone(tel) {
    const str = tel.replace(/[^0-9]/g, '');  // Remove non-numeric characters

    let t1, t2, t3;

    if (str.startsWith('02')) {
        t1 = str.slice(0, 2);
        t2 = str.slice(2, -4);
    } else if (str.startsWith('0')) {
        t1 = str.slice(0, 3);
        t2 = str.slice(3, -4);
    } else {
        t1 = '';               // No area code
        t2 = str.slice(0, -4);
    }

    t3 = str.slice(-4);

    return [t1, t2, t3].filter(Boolean).join('-');
}

function getPayMethod(method) {
    const payMethods = {
        '신용': '0',
        '착불': '1'
    };
    return payMethods[method] || '2'; //2 for unknown
}

// return [false, error_msg] or [true, group_uid]
function check_good_name_rule(rowData, group_uid_temp, name, good_list) {
    return true;
    // Separate products by "/"
    let goods = input.includes("/") ? input.split("/") : [input];

    // Process each product
    goods.forEach((good, idx) => {
        let errorMessage = "";

        // Check if the product is marked with "!" (no stock check)
        let checkStock = !good.startsWith("!");

        if (checkStock) {
            // Remove comments (text within square brackets)
            let commentBegin = good.indexOf("[");
            let commentEnd = good.indexOf("]");
            if (commentBegin !== -1 && commentEnd !== -1) {
                good = good.slice(0, commentBegin) + good.slice(commentEnd + 1);
            } else if (commentBegin !== -1) {
                errorMessage += "Comment start '[' without closing ']'. ";
            } else if (commentEnd !== -1) {
                errorMessage += "Comment end ']' without opening '['. ";
            }

            // Handle product classification (text within angle brackets "<>")
            let divideBegin = good.indexOf("<");
            let divideEnd = good.indexOf(">");
            if (divideBegin !== -1 && divideEnd !== -1) {
                let division = good.slice(divideBegin + 1, divideEnd);
                good = good.slice(0, divideBegin) + good.slice(divideEnd + 1);
                if (division.includes("B급")) {
                    goodObj.goodDivision = "2"; // B급 product
                } else if (division.includes("리퍼상품")) {
                    goodObj.goodDivision = "1"; // 리퍼 product
                } else {
                    errorMessage += "Invalid product classification. Only '리퍼상품' or 'B급' are allowed. ";
                }
            } else if (divideBegin !== -1 || divideEnd !== -1) {
                errorMessage += "Product classification syntax error. ";
            } else {
                goodObj.goodDivision = "0"; // Regular product
            }

            // Ensure the product is from a valid warehouse
            if (!warehouseArray.includes(goodObj.warehouse)) {
                errorMessage += "Invalid warehouse. Please specify a valid warehouse. ";
            }

            // Parse product name and quantity
            let nameQuantity = good.split("*");
            goodObj.name = nameQuantity[0].trim();
            goodObj.num = nameQuantity.length === 2 && !isNaN(nameQuantity[1]) ? parseInt(nameQuantity[1], 10) : 1;

            if (isNaN(goodObj.num)) {
                errorMessage += "Quantity is not a valid number. ";
            }

            // Handle separated delivery products (text within curly braces "{}")
            let separatedBegin = goodObj.name.indexOf("{");
            let separatedEnd = goodObj.name.indexOf("}");
            if (separatedBegin !== -1 && separatedEnd !== -1) {
                goodObj.divideNum = goodObj.name.slice(separatedBegin + 1, separatedEnd);
                goodObj.name = goodObj.name.slice(0, separatedBegin);
            } else if (separatedBegin !== -1 || separatedEnd !== -1) {
                errorMessage += "Separated delivery syntax error. ";
            }
        } else {
            group_uid_temp
        }

        if (errorMessage) {
            result.errorMessages.push(`${index}번째 : ${good} -> ${errorMessage}`);
        } else {
            result.goods.push(goodObj);
            result.goodNum++;
        }
    });

    return result;
}

function isSameBuyer(current, old) {
    return old && current.buyer_name === old.buyer_name && current.buyer_tel2 === old.buyer_tel2;
}