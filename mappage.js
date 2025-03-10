function getLocation() {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      function (myPosition) {
        document.getElementById("latitude").textContent =
          myPosition.coords.latitude;
        document.getElementById("longitude").textContent =
          myPosition.coords.longitude;
      },
      function (error) {
        console.error("Error Code = " + error.code + " - " + error.message);
      }
    );
  } else {
    console.log("Geolocation is not supported by this browser.");
  }
}

// 페이지가 로드되면 위치 정보를 가져옵니다.
getLocation();

async function fetchBusStopData() {
  const apiURLBusStopID =
    "http://apis.data.go.kr/6260000/BusanBIMS/busInfoByRouteId";
  const paramsBusStopID = {
    lineid: "5291107000",
    serviceKey:
      "p0QAukcE8CPueOqChvvwfFa%2Ffm%2B8XNVAakuI0w0t9VK17tZF7t%2B8f%2F398oI3GncLki2d7Os6ds94sPAIYbH1VA%3D%3D",
  };
  let extractedDataLeftTime = [];
  try {
    const responseBusStopID = await fetch(
      `${apiURLBusStopID}?lineid=${paramsBusStopID.lineid}&serviceKey=${paramsBusStopID.serviceKey}`
    );
    const xmlDataBusStopID = await responseBusStopID.text();
    const parser = new DOMParser();
    const xmlDocBusStopID = parser.parseFromString(
      xmlDataBusStopID,
      "text/xml"
    );
    const itemsBusStopID = xmlDocBusStopID.querySelectorAll("item");

    for (let item of itemsBusStopID) {
      const bstopnm = item.getElementsByTagName("bstopnm")[0].textContent;
      const nodeid = item.getElementsByTagName("nodeid")[0].textContent;

      const responseLeftTime = await fetch(
        `http://apis.data.go.kr/6260000/BusanBIMS/stopArrByBstopid?bstopid=${nodeid}&serviceKey=${paramsBusStopID.serviceKey}`
      );
      const xmlDataLeftTime = await responseLeftTime.text();
      const xmlDocLeftTime = parser.parseFromString(
        xmlDataLeftTime,
        "text/xml"
      );
      const min1 = xmlDocLeftTime.querySelector("min1");
      const min1Value = min1 ? min1.textContent : "No data";

      extractedDataLeftTime.push({ bstopnm, nodeid, min1Value });
      console.log(bstopnm, nodeid, min1Value);
    }
  } catch (error) {
    console.error("Error:", error);
  }

  const data = extractedDataLeftTime;

  var indexes = data.reduce((indices, item, index) => {
    if (item.min1Value === "1") {
      indices.push(index);
    }
    return indices;
  }, []);

  var filteredIndexes = indexes
    .sort((a, b) => a - b) // 배열을 오름차순으로 정렬
    .filter((value, index, array) => {
      // 첫 번째 요소이거나 이전 요소와 차이가 1보다 큰 경우에만 남김
      return index === 0 || value !== array[index - 1] + 1;
    });

  console.log(filteredIndexes);

  var imageSrcBus = "./images/bus.png";
  for (var i = 0; i < filteredIndexes.length; i++) {
    // 마커 이미지의 이미지 크기 입니다
    var imageSizeBus = new kakao.maps.Size(24, 24);

    // 마커 이미지를 생성합니다
    var markerImageBus = new kakao.maps.MarkerImage(imageSrcBus, imageSizeBus);

    // 마커를 생성합니다
    var markerBus = new kakao.maps.Marker({
      map: map, // 마커를 표시할 지도
      position: positions[filteredIndexes[i]].latlng, // 마커를 표시할 위치
      title: positions[filteredIndexes[i]].title, // 마커의 타이틀, 마커에 마우스를 올리면 타이틀이 표시됩니다
      image: markerImageBus, // 마커 이미지
    });
  }
}
fetchBusStopData(); // 버스 위치 api통해 받아옴

var mapContainer = document.getElementById("map"), // 지도를 표시할 div
  mapOption = {
    center: new kakao.maps.LatLng(35.23323610827515, 129.0829675907476), // 지도의 중심좌표
    level: 4, // 지도의 확대 레벨
  };

// 지도를 표시할 div와  지도 옵션으로  지도를 생성합니다
var map = new kakao.maps.Map(mapContainer, mapOption);
// 마우스 휠과 모바일 터치를 이용한 지도 확대, 축소를 막는다
map.setZoomable(false);
// HTML5의 geolocation으로 사용할 수 있는지 확인합니다
if (navigator.geolocation) {
  // GeoLocation을 이용해서 접속 위치를 얻어옵니다
  navigator.geolocation.getCurrentPosition(function (position) {
    var lat = position.coords.latitude, // 위도
      lon = position.coords.longitude; // 경도

    var locPosition = new kakao.maps.LatLng(lat, lon), // 마커가 표시될 위치를 geolocation으로 얻어온 좌표로 생성합니다
      message = '<div style="padding:5px;">현 위치</div>'; // 인포윈도우에 표시될 내용입니다

    // 마커와 인포윈도우를 표시합니다
    displayMarker(locPosition, message);
  });
} else {
  // HTML5의 GeoLocation을 사용할 수 없을때 마커 표시 위치와 인포윈도우 내용을 설정합니다

  var locPosition = new kakao.maps.LatLng(
      35.23279845667059,
      129.08287127976567
    ),
    message = "geolocation을 사용할수 없어요..";

  displayMarker(locPosition, message);
}

// 지도에 마커와 인포윈도우를 표시하는 함수입니다
function displayMarker(locPosition, message) {
  // 마커를 생성합니다
  var myLocation = new kakao.maps.Marker({
    map: map,
    position: locPosition,
  });

  var iwContent = message, // 인포윈도우에 표시할 내용
    iwRemoveable = true;

  // 인포윈도우를 생성합니다
  var infowindow = new kakao.maps.InfoWindow({
    content: iwContent,
    removable: iwRemoveable,
  });

  // 인포윈도우를 마커위에 표시합니다
  infowindow.open(map, myLocation);

  // 지도 중심좌표를 접속위치로 변경합니다
  map.setCenter(locPosition);
}

// 이미지 지도에서 마커가 표시될 위치입니다
var positions = [
  {
    title: "부산대역",
    latlng: new kakao.maps.LatLng(35.2301601568177, 129.08915457326725),
  },
  {
    title: "부산은행",
    latlng: new kakao.maps.LatLng(35.23138159335152, 129.0857372764594),
  },
  {
    title: "부산대정문",
    latlng: new kakao.maps.LatLng(35.23155471000984, 129.08471206185934),
  },
  {
    title: "부산대본관",
    latlng: new kakao.maps.LatLng(35.23311724350427, 129.0835905888779),
  },
  {
    title: "부산대문창회관",
    latlng: new kakao.maps.LatLng(35.23412358522657, 129.08258390650533),
  },
  {
    title: "부산대제2도서관",
    latlng: new kakao.maps.LatLng(35.23511417076229, 129.0814449962137),
  },
  {
    title: "부산대사회관",
    latlng: new kakao.maps.LatLng(35.23578205904361, 129.07994359830371),
  },
  {
    title: "부산대법학관",
    latlng: new kakao.maps.LatLng(35.23609232853234, 129.0786691948632),
  },
  {
    title: "부산대화학관",
    latlng: new kakao.maps.LatLng(35.23488670883005, 129.07829519404333),
  },
  {
    title: "부산대예술관",
    latlng: new kakao.maps.LatLng(35.232519784659495, 129.0777213417426),
  },
  {
    title: "부산대미술관",
    latlng: new kakao.maps.LatLng(35.232620188860615, 129.07633454471218),
  },
  {
    title: "부산대음악관",
    latlng: new kakao.maps.LatLng(35.23350414459488, 129.07641748593934),
  },
  {
    title: "부산대경암체육관",
    latlng: new kakao.maps.LatLng(35.23372835720218, 129.07556101904262),
  },
  {
    title: "부산대음악관",
    latlng: new kakao.maps.LatLng(35.233246590522654, 129.07632854645124),
  },
  {
    title: "부산대미술관",
    latlng: new kakao.maps.LatLng(35.23255226423515, 129.07622298261566),
  },
  {
    title: "부산대예술관",
    latlng: new kakao.maps.LatLng(35.23253282466958, 129.07774913200848),
  },
  {
    title: "부산대생활환경관",
    latlng: new kakao.maps.LatLng(35.234039032104874, 129.078067627782),
  },
  {
    title: "부산대화학관",
    latlng: new kakao.maps.LatLng(35.234883702599866, 129.07833905081642),
  },
  {
    title: "부산대법학관",
    latlng: new kakao.maps.LatLng(35.23631778813738, 129.07879027678757),
  },
  {
    title: "부산대사회관",
    latlng: new kakao.maps.LatLng(35.235757854553285, 129.07991002969746),
  },
  {
    title: "부산대제2도서관",
    latlng: new kakao.maps.LatLng(35.23502308928052, 129.08163213184434),
  },
  {
    title: "부산대문창회관",
    latlng: new kakao.maps.LatLng(35.23411314458289, 129.0824051616113),
  },
  {
    title: "부산대본관",
    latlng: new kakao.maps.LatLng(35.23292336243947, 129.0834675609769),
  },
  {
    title: "부산대정문",
    latlng: new kakao.maps.LatLng(35.23145759559185, 129.08472605073266),
  },
  {
    title: "금정등기소",
    latlng: new kakao.maps.LatLng(35.23042688015117, 129.08479302538325),
  },
  {
    title: "부산대후문",
    latlng: new kakao.maps.LatLng(35.22873222110846, 129.08495283222786),
  },
  {
    title: "신한은행",
    latlng: new kakao.maps.LatLng(35.228040479340024, 129.0865275807546),
  },
  {
    title: "부산대역",
    latlng: new kakao.maps.LatLng(35.229260001826994, 129.0892275855842),
  },
];

// 이미지 지도에 표시할 마커입니다
// 이미지 지도에 표시할 마커는 Object 형태입니다
for (var i = 0; i < positions.length; i++) {
  var marker = new kakao.maps.Marker({
    map: map,
    position: positions[i].latlng,
    title: positions[i].title,
  });
}

// 선을 구성하는 좌표 배열입니다. 이 좌표들을 이어서 선을 표시합니다
var linePathUp = [
  new kakao.maps.LatLng(35.2301601568177, 129.08915457326725), //부산대역
  new kakao.maps.LatLng(35.231160364255295, 129.08889741751022),
  new kakao.maps.LatLng(35.23124847395637, 129.08653287106873),
  new kakao.maps.LatLng(35.23138159335152, 129.0857372764594), //부산은행
  new kakao.maps.LatLng(35.23155471000984, 129.08471206185934), //부산대정문
  new kakao.maps.LatLng(35.23174619732856, 129.08340450204304),
  new kakao.maps.LatLng(35.23219992821586, 129.08322115921285),
  new kakao.maps.LatLng(35.23311724350427, 129.0835905888779), //부산대본관
  new kakao.maps.LatLng(35.23348869184806, 129.08373738059427),
  new kakao.maps.LatLng(35.23355404355451, 129.08373630670184),
  new kakao.maps.LatLng(35.23361517511286, 129.08371865006467),
  new kakao.maps.LatLng(35.2336972353, 129.08366308762288),
  new kakao.maps.LatLng(35.23377564247482, 129.0835580071806),
  new kakao.maps.LatLng(35.23386456942275, 129.08336532985967),
  new kakao.maps.LatLng(35.23407659471265, 129.08282708233614),
  new kakao.maps.LatLng(35.23412358522657, 129.08258390650533), //부산대문창회관
  new kakao.maps.LatLng(35.23421247730224, 129.08186952098202),
  new kakao.maps.LatLng(35.23501466588689, 129.08185982170568),
  new kakao.maps.LatLng(35.23506381200158, 129.08162218927714),
  new kakao.maps.LatLng(35.23511417076229, 129.0814449962137), //부산대제2도서관
  new kakao.maps.LatLng(35.23564523431636, 129.080170756864),
  new kakao.maps.LatLng(35.23578205904361, 129.07994359830371), //부산대사회관
  new kakao.maps.LatLng(35.23653551340923, 129.0788370227281),
  new kakao.maps.LatLng(35.23609232853234, 129.0786691948632), //부산대법학관
  new kakao.maps.LatLng(35.23488670883005, 129.07829519404333), //부산대화학관
  new kakao.maps.LatLng(35.2339343719786, 129.0779963122223),
  new kakao.maps.LatLng(35.23359940671214, 129.07795481673554),
  new kakao.maps.LatLng(35.2332257822604, 129.0779343017117),
  new kakao.maps.LatLng(35.23265944873142, 129.07772215857426), //부산대예술관
  new kakao.maps.LatLng(35.232151522355345, 129.07751974552926),
  new kakao.maps.LatLng(35.232363408528364, 129.07659433768987),
  new kakao.maps.LatLng(35.23241456937171, 129.07623869312692),
  new kakao.maps.LatLng(35.232601005128025, 129.07627090305476), //부산대미술관
  new kakao.maps.LatLng(35.23350414459488, 129.07641748593934), //부산대음악관
  new kakao.maps.LatLng(35.233629967689275, 129.07643716838834),
  new kakao.maps.LatLng(35.23375753759094, 129.07556725425565),
  new kakao.maps.LatLng(35.23372835720218, 129.07556101904262), //부산대경암체육관
];

var linePathDown = [
  new kakao.maps.LatLng(35.23372835720218, 129.07556101904262), //부산대경암체육관
  new kakao.maps.LatLng(35.23361036012966, 129.07639822730974),
  new kakao.maps.LatLng(35.233246590522654, 129.07632854645124), //부산대음악관
  new kakao.maps.LatLng(35.23255226423515, 129.07622298261566), //부산대미술관
  new kakao.maps.LatLng(35.23239036375445, 129.07620512700927),
  new kakao.maps.LatLng(35.232334086881636, 129.0765963359144),
  new kakao.maps.LatLng(35.23211957181246, 129.077543642367),
  new kakao.maps.LatLng(35.232519784659495, 129.0777213417426), //부산대예술관
  new kakao.maps.LatLng(35.233162305237286, 129.07795739438143),
  new kakao.maps.LatLng(35.233416344069845, 129.0779885875433),
  new kakao.maps.LatLng(35.23361249378989, 129.07797986281594),
  new kakao.maps.LatLng(35.234039032104874, 129.078067627782), //부산대생활환경관
  new kakao.maps.LatLng(35.234883702599866, 129.07833905081642), //부산대화학관
  new kakao.maps.LatLng(35.23631778813738, 129.07879027678757), //부산대법학관
  new kakao.maps.LatLng(35.23648348429612, 129.07884942412878),
  new kakao.maps.LatLng(35.235757854553285, 129.07991002969746), //부산대사회관
  new kakao.maps.LatLng(35.23561605423548, 129.0801645198338),
  new kakao.maps.LatLng(35.23506603135557, 129.0814931911893),
  new kakao.maps.LatLng(35.23502308928052, 129.08163213184434), //부산대제2도서관
  new kakao.maps.LatLng(35.23500167410488, 129.08182928532474),
  new kakao.maps.LatLng(35.2341926354203, 129.08184430145062),
  new kakao.maps.LatLng(35.23411314458289, 129.0824051616113), //부산대문창회관
  new kakao.maps.LatLng(35.234084689133326, 129.08261860752438),
  new kakao.maps.LatLng(35.23405684753115, 129.0827963734173),
  new kakao.maps.LatLng(35.233776918584475, 129.08348390316067),
  new kakao.maps.LatLng(35.233704983513704, 129.08360562404314),
  new kakao.maps.LatLng(35.23363178906061, 129.08366965074654),
  new kakao.maps.LatLng(35.233572767584576, 129.08369559879117),
  new kakao.maps.LatLng(35.23350516400028, 129.08369661510687),
  new kakao.maps.LatLng(35.233437844015796, 129.083681163934),
  new kakao.maps.LatLng(35.23292336243947, 129.0834675609769), //부산대본관
  new kakao.maps.LatLng(35.23219632228683, 129.08316889775415),
  new kakao.maps.LatLng(35.231690278433874, 129.08338110593118),
  new kakao.maps.LatLng(35.23145759559185, 129.08472605073266), //부산대정문
  new kakao.maps.LatLng(35.2314067411819, 129.08506247295406),
  new kakao.maps.LatLng(35.23042688015117, 129.08479302538325), //금정등기소
  new kakao.maps.LatLng(35.22897352672612, 129.08441537149005),
  new kakao.maps.LatLng(35.22873222110846, 129.08495283222786), //부산대후문
  new kakao.maps.LatLng(35.228040479340024, 129.0865275807546), //신한은행
  new kakao.maps.LatLng(35.2272855532918, 129.08849879197825),
  new kakao.maps.LatLng(35.22726592774168, 129.08859163857247),
  new kakao.maps.LatLng(35.22735678598816, 129.08867908095823),
  new kakao.maps.LatLng(35.2277433500419, 129.08873292130926),
  new kakao.maps.LatLng(35.228180617415354, 129.08885121134247),
  new kakao.maps.LatLng(35.228647799813295, 129.0890636211554),
  new kakao.maps.LatLng(35.22879796443568, 129.08910865644873),
  new kakao.maps.LatLng(35.229198916987315, 129.08924249283868),
  new kakao.maps.LatLng(35.229260001826994, 129.0892275855842), //부산대역
];

// 지도에 표시할 선을 생성합니다
var polylineUp = new kakao.maps.Polyline({
  path: linePathUp, // 선을 구성하는 좌표배열 입니다
  strokeWeight: 5, // 선의 두께 입니다
  strokeColor: "#005baa", // 선의 색깔입니다
  strokeOpacity: 0.7, // 선의 불투명도 입니다 1에서 0 사이의 값이며 0에 가까울수록 투명합니다
  strokeStyle: "solid", // 선의 스타일입니다
});

var polylineDown = new kakao.maps.Polyline({
  path: linePathDown, // 선을 구성하는 좌표배열 입니다
  strokeWeight: 5, // 선의 두께 입니다
  strokeColor: "#00A651", // 선의 색깔입니다
  strokeOpacity: 0.7, // 선의 불투명도 입니다 1에서 0 사이의 값이며 0에 가까울수록 투명합니다
  strokeStyle: "solid", // 선의 스타일입니다
});

// 지도에 선을 표시합니다
polylineUp.setMap(map);
polylineDown.setMap(map);
