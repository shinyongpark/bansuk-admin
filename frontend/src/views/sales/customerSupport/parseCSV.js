class CheckOrder {
    constructor(fileName, num, order_uid_start, companies, parsedStockGood) {
        if (!companies || !parsedStockGood) throw Error("화면을 새로고침 해주세요")

        this.warehouseArray = ['반석창고', '옐로우캡창고'];
        this.payMethods = {
            '신용': '0',
            '착불': '1'
        };
        this.orderCompanies = companies;
        this.stockGood = parsedStockGood;
        this.group_uid = 0;
        this.order_uid = Number(order_uid_start)
        this.old_uid = 0;
        this.goodNum = 0;
        this.divideGood = 0;
        this.divideGoodName = "";
        this.groupingGoods = []; //this->stock_good
        this.goodList = []; // this->good
        this.newGood = []; //new_good
        this.usedGood = []; //used_good
        this.BUsedGood = []; //b_used_good
        this.data = [];
        this.totalRow = Number(num);
        this.Err_num = 0;
        this.Err_str = '';
        this.fileName = fileName; // Store the filename if needed later
    }

    async getDataFromFile() {
        const reader = new FileReader();
        let old = {
            "p_name": "",
            "p_tel2": ""
        };

        return new Promise((resolve, reject) => {
            reader.onload = (event) => {
                const content = event.target.result;
                const rows = content.split("\n");

                rows.forEach((row, index) => {
                    this.group_uid += 1;
                    const columns = row.split(",");
                    let Err_str_temp = `${index + 1}번째 포멧 에러 메세지입니다:\n`
                    let Err_num_temp = 0;

                    // Skip empty rows or rows containing only whitespace
                    if (columns.length === 0 || columns.every(col => col.trim() === "")) {
                        return;
                    }

                    // Helper function to safely get and trim values from columns
                    const getValue = (index) => (columns[index] ? columns[index].trim() : '');
                    let rowData = {};

                    if (!this.checkDate(getValue(0))) {
                        Err_num_temp++;
                        Err_str_temp += `날짜가 형식에 맞지 않습니다. ${getValue(0)}`;
                    } else {
                        rowData['reg_date'] = new Date(getValue(0));
                        rowData['reg_date'].setHours(0, 0, 0, 0);
                    }
                    if (!this.orderCompanies.includes(getValue(1))) {
                        Err_num_temp++;
                        Err_str_temp += `판매 회사 [ ${getValue(1)} ]가 없습니다. 다시 확인해주세요`;
                    } else {
                        rowData['order_company'] = getValue(1);
                    }
                    rowData['receive_zip_code'] = this.formatZipCode(getValue(2));
                    rowData['receive_address'] = getValue(3);
                    rowData['receive_name'] = getValue(4);
                    rowData['receive_tel1'] = this.formatPhone(getValue(5));
                    rowData['receive_tel2'] = this.formatPhone(getValue(6));
                    rowData['goods_num'] = getValue(7);
                    rowData['delivery_cost'] = getValue(8);
                    if (!this.payMethods[getValue(9)]) {
                        Err_num_temp++;
                        Err_str_temp += `pay_method는 '신용' or '착불' 이어야 합니다.`;
                    } else {
                        rowData['pay_method'] = this.payMethods[getValue(9)];
                    }

                    rowData['comments'] = getValue(10).replace(/[\r\n'"]/g, '');
                    rowData['invoice_number'] = getValue(11);
                    rowData['supply_price'] = getValue(13);
                    rowData['selling_price'] = getValue(14);
                    rowData['settlement_price'] = getValue(15);
                    rowData['goods_serial'] = getValue(16);
                    rowData['order_serial'] = getValue(17);
                    rowData['buyer_name'] = getValue(18);
                    rowData['buyer_tel1'] = this.formatPhone(getValue(19));
                    rowData['buyer_tel2'] = this.formatPhone(getValue(20));
                    if (!this.warehouseArray.includes(getValue(21))) {
                        Err_num_temp++;
                        Err_str_temp += `창고는 '반석창고' or '옐로우캡창고' 이어야 합니다.`;
                    } else {
                        rowData['warehouse'] = getValue(21);
                    }
                    const parsed_good_name = getValue(12).replace(/\s/g, '')
                    rowData['goods_name'] = parsed_good_name;
                    const [Err_num_total, Err_str_total] = this.check_good_name_rule(index, rowData, parsed_good_name) //store err msg inside

                    // order_uid checking 구매자 이름, 전화번호2 동일시 order_uid 동일하게 or 주문자에 의한 주문번호 생성
                    if (old.p_name.trim() !== rowData.buyer_name.trim() || old.p_tel2.trim() !== rowData.buyer_tel2.trim()) {
                        this.order_uid++;
                    }
                    rowData["order_uid"] = String(this.order_uid);
                    old.p_name = rowData.buyer_name;
                    old.p_tel2 = rowData.buyer_tel2;

                    this.data.push(rowData);
                    if (Err_num_temp !== 0) { //포멧 에러 출력
                        this.Err_num += Err_num_temp
                        this.Err_str += (Err_str_temp + "\n");
                    }
                    if (Err_num_total !== 0) { //제품 이름 에러 출력 check_good_name_rule()
                        this.Err_num += Err_num_total
                        this.Err_str += (Err_str_total + "\n");
                    }

                });
                this.group_uid -= 1;
                // Check data length and errors b6 grouping
                if (this.data.length !== this.totalRow) {
                    return resolve([false, "총 주문수가 일치하지 않습니다\n", [], []]); // Resolve with error message
                } else if (this.Err_num > 0) {
                    return resolve([false, this.Err_str, [], []]); // Resolve with error message
                }

                this.Err_num = 0;
                this.Err_str = "";
                this.groupingGoods = this.grouping_goods();
                // check for errors
                if (this.Err_num > 0) {
                    return resolve([false, this.Err_str, [], []]); // Resolve with error message
                } else {
                    return resolve([true, this.data, this.goodList, this.groupingGoods]); // Resolve with processed data
                }
            };

            // Reject some other errs like no file etc. // "catch" later
            reader.onerror = function () {
                console.error("File read failed");
                reject([false, "파일을 읽는 중 오류가 발생했습니다."]);
            };

            // Start reading the file: may need to try encodings: 'UTF-8' or 'EUC-KR'
            reader.readAsText(this.fileName, 'EUC-KR');
        });
    }


    /////// helper functions //////////////////////////////////////////////////////////////////////////////////
    checkDate(str) {
        const a = new Date(str);
        return !isNaN(a.getTime());
    }

    formatZipCode(zip) {
        let newStr = zip.replace(/-/g, '');
        if (newStr.length === 6 && !isNaN(newStr)) {
            return `${newStr.substring(0, 3)}-${newStr.substring(3, 6)}`;
        }
        return '';
    }

    formatPhone(tel) {
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

    // return [false, error_msg] or [true,this.group_uid]
    check_good_name_rule(idx, rowData, name) {
        // return true;
        // goods : list of goods in good_name split by "/"
        let goods = name.includes("/") ? name.split("/") : [name];
        rowData.group_uid = this.group_uid;
        let Err_num_total = 0;
        let Err_str_total = '';


        // Process each good
        goods.forEach((good, idx_good) => {
            // Check if the product is marked with "!" (no stock check)
            let checkStock = !good.startsWith("!");
            let Err_num_temp = 0;
            let Err_str_temp = '';

            if (checkStock) {
                let curr_good;
                if (this.goodList[this.goodNum]) {
                    curr_good = this.goodList[this.goodNum];
                } else {
                    curr_good = { "line": idx };
                    this.goodList.push(curr_good);
                }

                // Remove comments (text within square brackets)
                let commentBegin = good.indexOf("[");
                let commentEnd = good.indexOf("]");
                if (commentBegin !== -1 && commentEnd !== -1) {
                    good = good.slice(0, commentBegin) + good.slice(commentEnd + 1);
                } else if (commentBegin !== -1) {
                    Err_str_temp += "코멘트의 앞부분만 '[' 있습니다. 뒷부분도 ']' 처리해 주시기 바랍니다. ";
                    Err_num_temp += 1
                } else if (commentEnd !== -1) {
                    Err_str_temp += "코멘트의 뒷부분만 ']' 있습니다. 앞부분도 '['] 처리해 주시기 바랍니다. ";
                    Err_num_temp += 1
                }

                // Handle product classification (text within angle brackets "<>")
                let divideBegin = good.indexOf("<");
                let divideEnd = good.indexOf(">");
                if (divideBegin !== -1 && divideEnd !== -1) {
                    let division = good.slice(divideBegin + 1, divideEnd);
                    good = good.slice(0, divideBegin) + good.slice(divideEnd + 1);
                    if (division.includes("B급")) {
                        curr_good.goodDivision = "2"; // B급 product
                    } else if (division.includes("리퍼상품")) {
                        curr_good.goodDivision = "1"; // 리퍼 product
                    } else {
                        Err_str_temp += "제품구분이 정확치 않습니다. <리퍼상품> or <B급리퍼상품>만 입력받습니다. ";
                        Err_num_temp += 1
                    }
                } else if (divideBegin !== -1) {
                    Err_str_temp += "제품 구문에 에러가 있습니다. 뒷부분도 '>' 처리해 주시기 바랍니다. ";
                    Err_num_temp += 1
                } else if (divideEnd !== -1) {
                    Err_str_temp += "제품 구문에 에러가 있습니다. 앞부분도 '<' 처리해 주시기 바랍니다. ";
                    Err_num_temp += 1
                } else {
                    curr_good.goodDivision = "0"; // Regular product
                }

                curr_good.warehouse = rowData.warehouse

                // 제품 이름과 수량을 분리
                if (good.includes('*')) {
                    let t = good.split('*');
                    curr_good.name = t[0].trim();
                    curr_good.num = !isNaN(t[1]) ? parseInt(t[1]) : false;
                } else {
                    curr_good.name = good.trim();
                    curr_good.num = 1;
                }
                // 제품의 수량이 숫자가 아닐경우
                if (isNaN(curr_good.num)) {
                    Err_str_temp += `${good} 수량이 숫자가 아닙니다`;
                    Err_num_temp += 1;
                }

                // Handle separated delivery products (text within curly braces "{}")
                if ((good.includes("{") && good.includes("}")) || (this.old_uid !== 0 && this.divideGood !== 0)) {
                    let divide_begin = good.indexOf("{");
                    let divide_end = good.indexOf("}");

                    // Extract divide_num from good name
                    curr_good.divide_num = good.substring(divide_begin + 1, divide_end);

                    // Remove the portion with {divide_num} from good name
                    curr_good.name = good.slice(0, divide_begin) + good.slice(divide_end + 1);

                    // 분리 제품 최초 발견
                    if (divideGood === 0 && this.divideGoodName !== curr_good.name) {
                        this.divideGoodName = curr_good.name; //분리 제품 이름 추가
                        curr_good.num = 1; // 분리 제품 최초 발견 제품 추가 안시킨다.
                        this.divideGood = 1;
                        this.old_uid = idx;
                    }
                    //  분리 제품이 연속 되어 있는가? 연속된 추가여야 한다.
                    else if (divideGood !== 0 && (divideGood === (i - this.old_uid)) && (curr_good.divide_num !== String(divideGood + 1))) {
                        curr_good.num = 0;
                        this.group_uid--;
                        this.data[i].group_uid = this.group_uid; //같은 소비자이므로 grouping
                        this.divideGood++;
                        this.goodNum--;// 제품수 증가
                    }
                    // 분리 제품의 마지막인가? //마지막 추가
                    else if (divideGood !== 0 && (divideGood === (i - this.old_uid)) && (curr_good.divide_num === String(divideGood + 1))) {
                        this.divideGoodName = ""; //분리 제품 이름 제거
                        curr_good.num = 0;
                        this.group_uid--;
                        this.data[i].group_uid = this.group_uid; //같은 소비자이므로 grouping
                        this.goodNum--;
                        this.old_uid = 0;
                        this.divideGood = 0;
                    } else { //other erros
                        if (curr_good.divide_num !== String(divideGood + 1)) {
                            Err_str_temp += "나눔 갯수가 맞지 않습니다.";
                        } else if (divideGoodName !== curr_good.name) {
                            Err_str_temp += "분리 제품은 연속이여야 합니다.";
                        } else if (divideGood !== (i - this.old_uid)) {
                            Err_str_temp += "분리 배송 제품의 최초 입력했던 갯수와 맞지 않습니다.";
                        } else {
                            Err_str_temp += "분리 배송 에러...";
                        }
                        Err_num_temp += 1
                        this.old_uid = 0;
                        this.divideGood = 0;
                    }
                } else if (good.includes("{") && !good.includes("}")) {
                    Err_str_temp += "분리 배송의 앞부분만 '{' 있습니다. 뒷부분도 '}' 처리해 주시기 바랍니다.";
                    Err_num_temp += 1
                } else if (!good.includes("{") && good.includes("}")) {
                    Err_str_temp += "분리 배송의 뒷부분만 '}' 있습니다. 앞부분도 '{' 처리해 주시기 바랍니다.";
                    Err_num_temp += 1
                } else {
                    this.old_uid = 0;
                    this.divideGood = 0;
                }

                // 입력한 제품 이름으로 DB에서 검색...
                const [matchingNames, idNamePair, noExistNames] = this.countGoodName(curr_good.name)
                // console.log("matchingNames, idNamePair, noExistNames", matchingNames, idNamePair, noExistNames)
                if (matchingNames.length === 1) { //정상: 하나만 찾은 경우
                    const [good_id, goodName] = idNamePair[0]
                    // console.log("good_id, goodName", good_id, goodName)
                    curr_good.line = idx + 1;
                    curr_good.code = good_id;
                    curr_good.real_name = goodName;
                    curr_good.reg_date = rowData.reg_date;
                } else if (matchingNames.length === 0) { //오류: 잘못 입력
                    Err_str_temp += `재고 시스템내에 일치 하는 이름이 없습니다: ${curr_good.name}`
                    Err_num_temp += 1
                } else { //오류: 여러개의 제품명이 나오는 경우
                    Err_str_temp += `재고 시스템내에 일치 하는 이름이 ${matchingNames.length} 개 있습니다: ${matchingNames} `;
                    Err_num_temp += 1
                }
                // 비활성화 제품이 있으면 에러 발생: check_data() 두번째 파트
                if (noExistNames.length !== 0) {
                    let Err_string_temp = noExistNames.map(noExistItem => {
                        return `${noExistItem.cateId}에 있는 ${noExistItem.good_id} : ${noExistItem.goodName} [${curr_good.goods_num}] 제품이 비활성 제품입니다.`;
                    }).join("");
                    Err_str_temp += Err_string_temp;
                    Err_num_temp += 1
                }

            } else {
                this.goodNum -= 1; // 재고 개수 파악할 제품들 검사??
            }

            if (Err_num_temp !== 0) {
                Err_str_temp = `${idx + 1} 번째 제품 이름에 대한 에러 메세지 입니다: ` + Err_str_temp;
                Err_str_total += Err_str_temp
                Err_num_total += Err_num_temp
            }
            this.goodNum += 1;
        });

        return [Err_num_total, Err_str_total];
    }

    countGoodName(curr_good_name) {
        let matchingNames = []
        let idNamePair = []
        let noExistNames = []
        this.stockGood.forEach(stockGoodItem => {
            if (stockGoodItem.goodAlias.toLowerCase().includes(`\\${curr_good_name.toLowerCase()}\\`)
                && stockGoodItem.goodExist === "y") {
                matchingNames.push(stockGoodItem.goodAlias)
                idNamePair.push([stockGoodItem.good_id, stockGoodItem.goodName])
            } else if (stockGoodItem.goodAlias.toLowerCase().includes(`\\${curr_good_name.toLowerCase()}\\`)
                && stockGoodItem.goodExist === "n") {
                noExistNames.push([stockGoodItem.cateId, stockGoodItem.good_id, stockGoodItem.goodName])
            }
        });
        return [matchingNames, idNamePair, noExistNames];
    }

    grouping_goods() {
        // Check for items with num = "0"
        for (let ll = 0; ll < this.totalRow; ll++) {
            if (this.goodList[ll].num === "0") {
                this.Err_str += `Error ${this.totalRow}개 중 ${this.goodList[ll].line} 번째 줄 '${this.goodList[ll].name}' 의 수량이 0입니다. 관리자에게 문의 하시고 함부로 다시 업로드 하지 마십시요..절대로..절대로.. 데이터가 중복 업데이트 됩니다.`;
                this.Err_num += 1
                return;
            }
        }

        console.log(`${this.goodNum}개의 제품의 Grouping 작업을 시작합니다.`);
        this.Err_str += `${this.goodNum}개의 제품의 Grouping 작업을 시작합니다.\n`

        // Group same products
        for (let i = 0, n = 0, u = 0, ub = 0; i < this.goodNum; i++) {
            const good = this.goodList[i];
            let k;
            try {
                if (good.goodDivision === '0') {
                    k = this.exist_array(this.goodList, this.newGood, i);
                    // console.log("grouping_goods k", k) 
                    if (k >= 0) {
                        this.newGood[k].num += good.num;
                    } else {
                        this.newGood[n++] = good;
                    }
                } else if (good.goodDivision === '1') {
                    k = this.exist_array(this.goodList, this.usedGood, i);
                    // console.log("grouping_goods k", k)
                    if (k >= 0) {
                        this.usedGood[k].num += good.num;
                    } else {
                        this.usedGood[u++] = good;
                    }
                } else if (good.goodDivision === '2') {
                    k = this.exist_array(this.goodList, this.BUsedGood, i);
                    // console.log("grouping_goods k", k)
                    if (k >= 0) {
                        this.BUsedGood[k].num += good.num;
                    } else {
                        this.BUsedGood[ub++] = good;
                    }
                } else {
                    this.Err_num += 1
                    this.Err_str += (`${i + 1} 번째 Grouping 작업중 발생한 에러입니다: ${good.goodDivision} 는 [0, 1, 2] 중 하나이거나 코드상에 문제가 있습니다` + "\n")
                }
            } catch (error) {
                this.Err_num += 1
                this.Err_str += (`${i + 1} 번째 Grouping 작업중 발생한 에러입니다: ` + error.message + "\n")
            }
        }

        return [
            ...this.newGood,
            ...(this.usedGood.length ? this.usedGood : []),
            ...(this.BUsedGood.length ? this.BUsedGood : [])
        ];
    }

    exist_array(a, b, k) {
        // Check if the same product exists based on code and warehouse
        for (let i = 0; i < b.length; i++) {
            // console.log("b", b)
            // console.log("b[i].code, a[k].code, b[i].warehouse, a[k].warehouse", b[i].code, a[k].code, b[i].warehouse, a[k].warehouse)
            if (b[i].code.trim() === a[k].code.trim() && b[i].warehouse.trim() === a[k].warehouse.trim()) {
                return i;
            }
        }
        return -1;
    }
}
export default CheckOrder;



