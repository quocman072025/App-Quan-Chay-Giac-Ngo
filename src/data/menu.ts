export type Category =
  | 'Món chính'
  | 'Bánh mì'
  | 'Đồ uống'
  | 'Món thêm'
  | 'Thực phẩm';

export interface MenuItem {
  id: string;
  name: string;
  unit: string;
  price: number;
  category: Category;
  image: string;

  // Dùng cho những món có nhiều mức giá lựa chọn.
  // Ví dụ: Đồ ăn cơm thập cẩm: 10K / 20K / 30K / 40K / 50K
  priceOptions?: number[];
}

export const menuItems: MenuItem[] = [

  // =========================================================
  // BÁNH MÌ
  // =========================================================

  {
    id: '1',
    name: 'Bánh mì phá lấu',
    unit: 'cái',
    price: 15000,
    category: 'Bánh mì',
    image: 'https://picsum.photos/seed/banhmi1/200/200',
  },

  {
    id: '2',
    name: 'Bánh mì sườn chiên',
    unit: 'cái',
    price: 15000,
    category: 'Bánh mì',
    image: 'https://picsum.photos/seed/banhmi2/200/200',
  },

  {
    id: '3',
    name: 'Bánh mì sườn chả',
    unit: 'cái',
    price: 15000,
    category: 'Bánh mì',
    image: 'https://picsum.photos/seed/banhmi3/200/200',
  },

  {
    id: '4',
    name: 'Bánh mì pate chà bông',
    unit: 'cái',
    price: 15000,
    category: 'Bánh mì',
    image: 'https://picsum.photos/seed/banhmi4/200/200',
  },

  {
    id: '58',
    name: 'Bánh mì thập cẩm',
    unit: 'cái',
    price: 20000,
    category: 'Bánh mì',
    image: 'https://picsum.photos/seed/banhmithapcam/200/200',
  },

  {
    id: '64',
    name: 'Bánh mì chả chà bông',
    unit: 'cái',
    price: 15000,
    category: 'Bánh mì',
    image: 'https://picsum.photos/seed/banhmichachabong/200/200',
  },

  {
    id: '65',
    name: 'Bánh mì bì chả',
    unit: 'cái',
    price: 15000,
    category: 'Bánh mì',
    image: 'https://picsum.photos/seed/banhmibicha/200/200',
  },


  // =========================================================
  // MÓN CHÍNH
  // =========================================================

  {
    id: '20',
    name: 'Cơm phần thập cẩm',
    unit: 'phần',
    price: 25000,
    category: 'Món chính',
    image: 'https://picsum.photos/seed/com1/200/200',
  },

  {
    id: '5',
    name: 'Bún gạo xào',
    unit: 'phần',
    price: 20000,
    category: 'Món chính',
    image: 'https://picsum.photos/seed/bungaoxao/200/200',
  },

  {
    id: '6',
    name: 'Bún chả giò',
    unit: 'phần',
    price: 20000,
    category: 'Món chính',
    image: 'https://picsum.photos/seed/bunchagio/200/200',
  },

  {
    id: '7',
    name: 'Bánh ướt',
    unit: 'phần',
    price: 20000,
    category: 'Món chính',
    image: 'https://picsum.photos/seed/banhuot/200/200',
  },

  {
    id: '8',
    name: 'Hủ tiếu',
    unit: 'phần',
    price: 25000,
    category: 'Món chính',
    image: 'https://picsum.photos/seed/hutieu/200/200',
  },

  {
    id: '9',
    name: 'Hủ tiếu mì',
    unit: 'phần',
    price: 25000,
    category: 'Món chính',
    image: 'https://picsum.photos/seed/hutieumi/200/200',
  },

  {
    id: '10',
    name: 'Hủ tiếu bò kho',
    unit: 'phần',
    price: 25000,
    category: 'Món chính',
    image: 'https://picsum.photos/seed/hutieubokho/200/200',
  },

  {
    id: '11',
    name: 'Bún huế',
    unit: 'phần',
    price: 25000,
    category: 'Món chính',
    image: 'https://picsum.photos/seed/bunbohue/200/200',
  },

  {
    id: '12',
    name: 'Bánh canh',
    unit: 'phần',
    price: 25000,
    category: 'Món chính',
    image: 'https://picsum.photos/seed/banhcanh/200/200',
  },

  {
    id: '13',
    name: 'Bánh canh cua',
    unit: 'phần',
    price: 25000,
    category: 'Món chính',
    image: 'https://picsum.photos/seed/banhcanhcua/200/200',
  },

  {
    id: '14',
    name: 'Nui',
    unit: 'phần',
    price: 25000,
    category: 'Món chính',
    image: 'https://picsum.photos/seed/nui/200/200',
  },

  {
    id: '15',
    name: 'Bún riêu',
    unit: 'phần',
    price: 25000,
    category: 'Món chính',
    image: 'https://picsum.photos/seed/bunrieu/200/200',
  },

  {
    id: '16',
    name: 'Phở',
    unit: 'phần',
    price: 25000,
    category: 'Món chính',
    image: 'https://picsum.photos/seed/pho/200/200',
  },

  {
    id: '17',
    name: 'Bún măng',
    unit: 'phần',
    price: 25000,
    category: 'Món chính',
    image: 'https://picsum.photos/seed/bunmang/200/200',
  },

  {
    id: '18',
    name: 'Bún mắm',
    unit: 'phần',
    price: 25000,
    category: 'Món chính',
    image: 'https://picsum.photos/seed/bunmam/200/200',
  },

  {
    id: '19',
    name: 'Bún mọc',
    unit: 'phần',
    price: 25000,
    category: 'Món chính',
    image: 'https://picsum.photos/seed/bunmoc/200/200',
  },

  // ---------------------------------------------------------
  // ĐỒ ĂN CƠM THẬP CẨM - 1 MÓN, 5 MỨC GIÁ
  // ---------------------------------------------------------

  {
    id: '66',
    name: 'Đồ ăn cơm thập cẩm',
    unit: 'phần',
    price: 10000,
    priceOptions: [
      10000,
      20000,
      30000,
      40000,
      50000,
    ],
    category: 'Món chính',
    image: 'https://picsum.photos/seed/comthapcam/200/200',
  },


  // =========================================================
  // MÓN THÊM
  // =========================================================

  {
    id: '21',
    name: 'Gỏi cuốn',
    unit: 'cuốn',
    price: 6000,
    category: 'Món thêm',
    image: 'https://picsum.photos/seed/goicuon/200/200',
  },

  {
    id: '23',
    name: 'Chả thêm',
    unit: 'phần',
    price: 5000,
    category: 'Món thêm',
    image: 'https://picsum.photos/seed/chathem/200/200',
  },

  {
    id: '24',
    name: 'Tàu hủ thêm',
    unit: 'phần',
    price: 5000,
    category: 'Món thêm',
    image: 'https://picsum.photos/seed/tauhuthem/200/200',
  },

  {
    id: '25',
    name: 'Hoành thánh thêm',
    unit: 'phần',
    price: 5000,
    category: 'Món thêm',
    image: 'https://picsum.photos/seed/hoanhthanhthem/200/200',
  },

  {
    id: '26',
    name: 'Tàu hủ ki thêm',
    unit: 'phần',
    price: 5000,
    category: 'Món thêm',
    image: 'https://picsum.photos/seed/tauhukithem/200/200',
  },

  {
    id: '71',
    name: 'Chả giò thêm',
    unit: 'phần',
    price: 5000,
    category: 'Món thêm',
    image: 'https://picsum.photos/seed/chagioithem/200/200',
  },

  {
    id: '59',
    name: 'Dụng cụ ăn uống',
    unit: 'phần',
    price: 3000,
    category: 'Món thêm',
    image: 'https://picsum.photos/seed/dungcuanuong/200/200',
  },


  // =========================================================
  // ĐỒ UỐNG
  // =========================================================

  // Tất cả đồ uống bên dưới đều là CHAI,
  // ngoại trừ Trà đá, Trà Tắc và Tẩy đá.

  {
    id: '27',
    name: 'Nước suối',
    unit: 'Chai',
    price: 10000,
    category: 'Đồ uống',
    image: 'https://picsum.photos/seed/nuocsuoi/200/200',
  },

  {
    id: '28',
    name: 'Nước sâm',
    unit: 'Chai',
    price: 10000,
    category: 'Đồ uống',
    image: 'https://picsum.photos/seed/nuocsam/200/200',
  },

  {
    id: '29',
    name: 'Nước pepsi',
    unit: 'Chai',
    price: 15000,
    category: 'Đồ uống',
    image: 'https://picsum.photos/seed/pepsi/200/200',
  },

  {
    id: '30',
    name: 'Nước coca',
    unit: 'Chai',
    price: 15000,
    category: 'Đồ uống',
    image: 'https://picsum.photos/seed/coca/200/200',
  },

  {
    id: '31',
    name: 'Nước revive chanh muối',
    unit: 'Chai',
    price: 15000,
    category: 'Đồ uống',
    image: 'https://picsum.photos/seed/revive/200/200',
  },

  {
    id: '32',
    name: 'Nước 7 úp',
    unit: 'Chai',
    price: 15000,
    category: 'Đồ uống',
    image: 'https://picsum.photos/seed/7up/200/200',
  },

  {
    id: '33',
    name: 'Nước trà Ô long',
    unit: 'Chai',
    price: 15000,
    category: 'Đồ uống',
    image: 'https://picsum.photos/seed/traolong/200/200',
  },

  // ---------------------------------------------------------
  // 3 MÓN ĐƠN VỊ LY
  // ---------------------------------------------------------

  {
    id: '34',
    name: 'Trà Tắc',
    unit: 'Ly',
    price: 15000,
    category: 'Đồ uống',
    image: 'https://picsum.photos/seed/tratac/200/200',
  },

  {
    id: '60',
    name: 'Trà đá',
    unit: 'Ly',
    price: 2000,
    category: 'Đồ uống',
    image: 'https://picsum.photos/seed/trada/200/200',
  },

  {
    id: '76',
    name: 'Tẩy đá',
    unit: 'Ly',
    price: 1000,
    category: 'Đồ uống',
    image: 'https://picsum.photos/seed/tayda/200/200',
  },

  // ---------------------------------------------------------
  // CÁC MÓN CÒN LẠI ĐỀU LÀ CHAI
  // ---------------------------------------------------------

  {
    id: '35',
    name: 'Sữa đậu nành',
    unit: 'Chai',
    price: 10000,
    category: 'Đồ uống',
    image: 'https://picsum.photos/seed/suadaunanh/200/200',
  },

  {
    id: '36',
    name: 'Sữa Bắp Hạt Điều',
    unit: 'Chai',
    price: 15000,
    category: 'Đồ uống',
    image: 'https://picsum.photos/seed/suabap/200/200',
  },

  {
    id: '37',
    name: 'Sữa Bí Đỏ Đậu Gà',
    unit: 'Chai',
    price: 15000,
    category: 'Đồ uống',
    image: 'https://picsum.photos/seed/suabido/200/200',
  },

  {
    id: '38',
    name: 'Sữa Hạt Milo',
    unit: 'Chai',
    price: 15000,
    category: 'Đồ uống',
    image: 'https://picsum.photos/seed/suamilo/200/200',
  },

  {
    id: '39',
    name: 'Sữa yến mạch',
    unit: 'Chai',
    price: 15000,
    category: 'Đồ uống',
    image: 'https://picsum.photos/seed/suayenmach/200/200',
  },

  {
    id: '61',
    name: 'Sữa Bắp như ý',
    unit: 'Chai',
    price: 12000,
    category: 'Đồ uống',
    image: 'https://picsum.photos/seed/suabapnhuy/200/200',
  },

  {
    id: '62',
    name: 'Sữa hạt sen như ý',
    unit: 'Chai',
    price: 12000,
    category: 'Đồ uống',
    image: 'https://picsum.photos/seed/suahatsen/200/200',
  },

  {
    id: '63',
    name: 'Sữa gạo lứt như ý',
    unit: 'Chai',
    price: 12000,
    category: 'Đồ uống',
    image: 'https://picsum.photos/seed/suagaolut/200/200',
  },

  {
    id: '72',
    name: 'Nước Khoáng đảnh thạnh',
    unit: 'Chai',
    price: 10000,
    category: 'Đồ uống',
    image: 'https://picsum.photos/seed/nuockhoangdanhthanh/200/200',
  },

  {
    id: '73',
    name: 'Trà Mát Ta',
    unit: 'Chai',
    price: 15000,
    category: 'Đồ uống',
    image: 'https://picsum.photos/seed/tramat/200/200',
  },

  {
    id: '74',
    name: 'Nước ép',
    unit: 'Chai',
    price: 25000,
    category: 'Đồ uống',
    image: 'https://picsum.photos/seed/nuocep/200/200',
  },


  // =========================================================
  // THỰC PHẨM
  // =========================================================

  {
    id: '40',
    name: 'Chả lụa nhà làm',
    unit: '1 kg',
    price: 160000,
    category: 'Thực phẩm',
    image: 'https://picsum.photos/seed/chalua/200/200',
  },

  {
    id: '41',
    name: 'Rong biển cháy tỏi nhỏ',
    unit: 'hủ',
    price: 35000,
    category: 'Thực phẩm',
    image: 'https://picsum.photos/seed/rongbiennho/200/200',
  },

  {
    id: '42',
    name: 'Rong biển cháy tỏi lớn',
    unit: 'hủ',
    price: 55000,
    category: 'Thực phẩm',
    image: 'https://picsum.photos/seed/rongbienlon/200/200',
  },

  {
    id: '43',
    name: 'Sườn chiên nhỏ',
    unit: 'hủ',
    price: 50000,
    category: 'Thực phẩm',
    image: 'https://picsum.photos/seed/suonchiennho/200/200',
  },

  {
    id: '44',
    name: 'Sườn chiên lớn',
    unit: 'hủ',
    price: 75000,
    category: 'Thực phẩm',
    image: 'https://picsum.photos/seed/suonchienlon/200/200',
  },

  {
    id: '45',
    name: 'Chao môn lớn',
    unit: 'hủ',
    price: 55000,
    category: 'Thực phẩm',
    image: 'https://picsum.photos/seed/chaomonlon/200/200',
  },

  {
    id: '75',
    name: 'Chao môn nhỏ',
    unit: 'hủ',
    price: 40000,
    category: 'Thực phẩm',
    image: 'https://picsum.photos/seed/chaomonnho/200/200',
  },

  {
    id: '46',
    name: 'Phá lấu',
    unit: '1 lạng',
    price: 20000,
    category: 'Thực phẩm',
    image: 'https://picsum.photos/seed/phalau/200/200',
  },

  {
    id: '48',
    name: 'Bánh đậu xanh',
    unit: 'hộp',
    price: 35000,
    category: 'Thực phẩm',
    image: 'https://picsum.photos/seed/banhdauxanh/200/200',
  },

  {
    id: '49',
    name: 'Sa tế ớt',
    unit: 'hủ',
    price: 30000,
    category: 'Thực phẩm',
    image: 'https://picsum.photos/seed/sateot/200/200',
  },

  {
    id: '50',
    name: 'Sa tế sả',
    unit: 'hủ',
    price: 30000,
    category: 'Thực phẩm',
    image: 'https://picsum.photos/seed/satesa/200/200',
  },

  {
    id: '51',
    name: 'Khô cá mè',
    unit: 'hủ',
    price: 40000,
    category: 'Thực phẩm',
    image: 'https://picsum.photos/seed/khocame/200/200',
  },

  {
    id: '52',
    name: 'Khô nai',
    unit: 'hủ',
    price: 50000,
    category: 'Thực phẩm',
    image: 'https://picsum.photos/seed/khonai/200/200',
  },

  {
    id: '53',
    name: 'Khô bò',
    unit: 'hủ',
    price: 50000,
    category: 'Thực phẩm',
    image: 'https://picsum.photos/seed/khobo/200/200',
  },

  {
    id: '54',
    name: 'Chà bông',
    unit: 'hủ',
    price: 60000,
    category: 'Thực phẩm',
    image: 'https://picsum.photos/seed/chabong/200/200',
  },

  {
    id: '55',
    name: 'Tương kho quẹt',
    unit: 'hủ',
    price: 25000,
    category: 'Thực phẩm',
    image: 'https://picsum.photos/seed/tuongkhoquet/200/200',
  },

  {
    id: '56',
    name: 'Mắm ruốc',
    unit: 'hủ',
    price: 35000,
    category: 'Thực phẩm',
    image: 'https://picsum.photos/seed/mamruoc/200/200',
  },

  {
    id: '57',
    name: 'Tương hột',
    unit: 'hủ',
    price: 35000,
    category: 'Thực phẩm',
    image: 'https://picsum.photos/seed/tuonghot/200/200',
  },
];