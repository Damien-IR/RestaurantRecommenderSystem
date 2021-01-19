$(document).ready(refreshList);

var GLOBAL_PATH = '{{ STATIC_PATH }}';

var mapContainer = document.getElementById('map'), // 지도를 표시할 div
    mapOption = {
        center: new kakao.maps.LatLng(37.5027899, 127.0257131), // 지도의 중심좌표
        level: 3 // 지도의 확대 레벨
    };

var map = new kakao.maps.Map(mapContainer, mapOption); // 지도를 생성합니다
// 일반 지도와 스카이뷰로 지도 타입을 전환할 수 있는 지도타입 컨트롤을 생성합니다
var mapTypeControl = new kakao.maps.MapTypeControl();

// 지도에 컨트롤을 추가해야 지도위에 표시됩니다
// kakao.maps.ControlPosition은 컨트롤이 표시될 위치를 정의하는데 TOPRIGHT는 오른쪽 위를 의미합니다
map.addControl(mapTypeControl, kakao.maps.ControlPosition.TOPRIGHT);

// 지도 확대 축소를 제어할 수 있는  줌 컨트롤을 생성합니다
var zoomControl = new kakao.maps.ZoomControl();
map.addControl(zoomControl, kakao.maps.ControlPosition.RIGHT);

var markers = [];
var myArr = [];
var result = null;
var page = 1;

function get_email() {
    return document.getElementById("email").innerText.trim();
}

function sizeMatchToScreen() {
    let width = $(window).width;
    let height = $(window).height;
    const listWidth = 400;
    $('#map').css({'width': (width - listWidth) + 'px', 'height': (height) + 'px'});
    $('#list').css({'width': (listWidth) + 'px', 'height': (height) + 'px'});
    relayout();
}

function relayout() {
    // 지도를 표시하는 div 크기를 변경한 이후 지도가 정상적으로 표출되지 않을 수도 있습니다
    // 크기를 변경한 이후에는 반드시  map.relayout 함수를 호출해야 합니다
    // window의 resize 이벤트에 의한 크기변경은 map.relayout 함수가 자동으로 호출됩니다
    map.relayout();
}

function refreshList() {
    page = 1;
    sizeMatchToScreen();
    getListInfo();
}

function getListInfo() {
    // 지도 영역정보를 얻어옵니다
    let bounds = map.getBounds();
    // 영역정보의 남서쪽 정보를 얻어옵니다
    let sw = bounds.getSouthWest();
    // 영역정보의 북동쪽 정보를 얻어옵니다
    let ne = bounds.getNorthEast();
    let url = "/pos/?xMin="
        + sw.getLng()
        + "&xMax="
        + ne.getLng()
        + "&yMin="
        + sw.getLat()
        + "&yMax="
        + ne.getLat()
        + "&email="
        + get_email()
        + "&page="
        + page;
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function () {
        if (this.readyState === 4 && this.status === 200) {
            myArr = JSON.parse(this.responseText);
            changeList(myArr);
        }
    };
    xmlhttp.open("GET", url, true);
    xmlhttp.send();
}

function changeList(json_response) {
    hideMarkers();
    let list = document.getElementById('list_place');
    while (list.hasChildNodes()) {
        list.removeChild(list.firstChild);
    }
    var replies = json_response;
    for (var iterIndex = 0; iterIndex < json_response.length; iterIndex++) {
        var url = "https://store.naver.com/restaurants/detail?id=" + replies[iterIndex].id;

        // 가게 정보 1칸 태그 생성 list_item_inner
        var li = document.createElement("li");
        li.className = "list_item_inner";
        li.setAttribute('data-toggle', 'collapse');
        li.setAttribute('href', ("#collapse" + (iterIndex + 1)));
        li.setAttribute('data-parent', '#list_place');
        list.append(li);

        var accordian = document.createElement('div');
        accordian.className = "panel-collapse collapse";
        accordian.id = "collapse" + (iterIndex + 1);
        list.appendChild(accordian);

        var innerPanel = document.createElement('div');
        innerPanel.className = 'panel-body';
        // innerPanel.innerText = "test";
        accordian.appendChild(innerPanel);

        // addListsUnderUl(replies[iterIndex].pk, innerPanel, iterIndex);

        // 썸네일 주소 태그 thumb_area
        var thumbArea = document.createElement("a");
        thumbArea.className = "thumb_area";
        thumbArea.href = url;
        thumbArea.target = '_blank';
        thumbArea.setAttribute('float', 'left');
        li.appendChild(thumbArea);

        // 썸네일 감싸는 블럭 thumb
        var thumb = document.createElement('thumb');
        thumb.className = 'thumb';
        thumbArea.appendChild(thumb);

        // 썸네일 이미지
        var img = document.createElement('img');
        img.src = replies[iterIndex].imageSrc;
        img.onerror = ("this.src=" + GLOBAL_PATH + "/images/noimage.png");
        img.width = 100;
        img.height = 100;
        thumb.appendChild(img);

        // 이미지를 제외한 전체 정보들 태그 (오른쪽) infos
        var info = document.createElement('div');
        info.className = 'infos';
        info.setAttribute('float', 'right');
        li.appendChild(info);

        // 예외문 처리 필요 category
        var category = document.createElement('span');
        category.className = 'category';
        category.innerText = replies[iterIndex].category;
        info.appendChild(category);

        // 최상위 영역 (제목, 카테고리) top_area
        var topArea = document.createElement('div');
        topArea.className = 'top_area';
        info.appendChild(topArea);


        // 제목란 링크 태그 title_area
        var titleArea = document.createElement('a');
        titleArea.className = 'title_area';
        titleArea.href = url;
        titleArea.target = '_blank';
        topArea.appendChild(titleArea);

        // A ~ Z 사이의 알파벳 보여줌 title_char
        var character = document.createElement('em');
        character.className = 'title_char';
        character.innerText = (Number(iterIndex) + 1) + ' ';
        titleArea.appendChild(character);

        // 가게 이름 title_name
        var name = document.createElement('span');
        name.className = 'title_name';
        name.innerText = replies[iterIndex].name;
        titleArea.appendChild(name);

        // 중앙부, 주소만 넣을 예정 li_body
        var liBody = document.createElement('div');
        liBody.className = 'li_body';
        info.appendChild(liBody);

        // // 도로명 주소 roadAddr
        // var roadAddr = document.createElement('div');
        // roadAddr.className = 'roadAddr';
        // roadAddr.innerText = replies[i].fields.roadAddr;
        // liBody.appendChild(roadAddr);

        // 지번 주소 commonAddr
        var commonAddr = document.createElement('div');
        commonAddr.className = 'commonAddr';
        commonAddr.innerText = replies[iterIndex].commonAddr;
        liBody.appendChild(commonAddr);

        // 리뷰 컨테이너
        var reviewsDiv = document.createElement('div');
        reviewsDiv.className = 'reviewContainer';
        info.appendChild(reviewsDiv);

        // 블로그 리뷰
        var blogReview = document.createElement('span');
        blogReview.className = 'blogReviewCount';
        blogReview.innerText = "블로그 리뷰 " + replies[iterIndex].blogCafeReviewCount + ' | ';
        reviewsDiv.appendChild(blogReview);

        // 예약자 리뷰
        var bookingReview = document.createElement('span');
        bookingReview.className = 'bookingReviewCount';
        bookingReview.innerText = "예약자 리뷰 " + replies[iterIndex].bookingReviewCount;
        reviewsDiv.appendChild(bookingReview);

        // 예상 점수
        var predictScore = document.createElement('span');
        predictScore.className = "predict_score";
        predictScore.innerText = "예상 점수 : " + replies[iterIndex].pred_score;
        info.appendChild(predictScore);

        var markerImageUrl = 'http://t1.daumcdn.net/localimg/localimages/07/2018/pc/img/marker_normal.png',
            markerImageSize = new kakao.maps.Size(35, 50), // 마커 이미지의 크기
            markerImageOptions = {
                spriteOrigin: new kakao.maps.Point(121, 60 * iterIndex), // 스프라이트 이미지 중 사용할 영역의 좌상단 좌표
                spriteSize: new kakao.maps.Size(276, 891), // 스프라이트 이미지의 전체 크기
                offset: new kakao.maps.Point(15, 45)// 마커 좌표에 일치시킬 이미지 안의 좌표
            };

        // 마커 이미지 생성
        var markerImage = new kakao.maps.MarkerImage(markerImageUrl, markerImageSize, markerImageOptions);

        // 지도에 마커를 생성 후 표시
        var marker = new kakao.maps.Marker({
            // replies 내의 yPos, xPos 순으로 입력 (네이버와 반대)
            position: new kakao.maps.LatLng(replies[iterIndex].yPos, replies[iterIndex].xPos), // 마커의 좌표
            image: markerImage, // 마커의 이미지
            map: map, // 마커를 표시할 지도 객체
            title: replies[iterIndex].name
        });

        // 마커 리스트에 추가
        markers.push(marker);
    }
    setMarkers(map);
}

function setMarkers(map) {
    for (var iterIndex = 0; iterIndex < markers.length; iterIndex++) {
        markers[iterIndex].setMap(map);
    }
}

function hideMarkers() {
    while (markers.length > 0) {
        let tmp = markers.pop().setMap(null);
        delete (tmp);
    }
}

function toggleAccordion(clickedNode) {
    $(clickedNode).collapse();
}

function addListsUnderUl(id, panel, paramIter) {
    var result = {};
    var request = new XMLHttpRequest();
    request.onreadystatechange = function () {
        if (this.readyState === 4 && this.status === 200) {
            result = JSON.parse(this.responseText);
            if (result.src.length > 0) {
                var carouselContainer = document.createElement('div');
                carouselContainer.className = "carousel slide";
                carouselContainer.id = "carouselWithIndicator" + paramIter;
                carouselContainer.setAttribute('data-ride', 'carousel');
                panel.appendChild(carouselContainer);

                var carouselIndicators = document.createElement('ol');
                carouselIndicators.className = "carousel-indicators";
                carouselContainer.appendChild(carouselIndicators);

                var carouselImgList = document.createElement('div');
                carouselImgList.className = "carousel-inner";
                carouselContainer.appendChild(carouselImgList);

                var prevButton = document.createElement('a');
                prevButton.className = "carousel-control-prev";
                prevButton.href = "#carouselWithIndicator" + paramIter;
                prevButton.setAttribute('role', 'button');
                prevButton.setAttribute('data-slide', 'prev');
                carouselContainer.appendChild(prevButton);

                var prevIcon = document.createElement('span');
                prevIcon.className = "carousel-control-prev-icon";
                prevIcon.setAttribute('aria-hidden', 'true');
                prevButton.appendChild(prevIcon);

                var prevText = document.createElement('span');
                prevText.className = "sr-only";
                prevText.innerText = "Previous";
                prevButton.appendChild(prevText);

                var nextButton = document.createElement('a');
                nextButton.className = "carousel-control-next";
                nextButton.href = "#carouselWithIndicator" + paramIter;
                nextButton.setAttribute('role', 'button');
                nextButton.setAttribute('data-slide', 'next');
                carouselContainer.appendChild(nextButton);

                var nextIcon = document.createElement('span');
                nextIcon.className = "carousel-control-next-icon";
                nextIcon.setAttribute('aria-hidden', 'true');
                nextButton.appendChild(nextIcon);

                var nextText = document.createElement('span');
                prevText.className = "sr-only";
                prevText.innerText = "Next";
                nextButton.appendChild(nextText);

                for (let index = 0; index < result.src.length; index++) {
                    let indicator = document.createElement('li');
                    indicator.setAttribute('data-target', "#carouselWithIndicator" + paramIter);
                    indicator.setAttribute("data-slide-to", index);
                    if (index == 0) {
                        indicator.className = 'active';
                    }
                    carouselIndicators.appendChild(indicator);

                    let carouselItem = document.createElement('div');
                    if (index == 0) {
                        carouselItem.className = "carousel-item active"
                    } else {
                        carouselItem.className = "carousel-item";
                    }
                    carouselImgList.appendChild(carouselItem);

                    let carouselImg = document.createElement('img');
                    carouselImg.src = result.src[index];
                    carouselImg.setAttribute('alt', (index + 1) + "th img");
                    carouselImg.className = "d-block w-100";
                    carouselImg.width = 400;
                    carouselItem.appendChild(carouselImg);
                }
            }

            if (Object.keys(result.menu).length > 0) {
                let menuList = document.createElement('table');
                menuList.className = 'table table-hover';
                panel.appendChild(menuList);

                let headRow = document.createElement('tr');
                headRow.className = 'tableHead';
                menuList.appendChild(headRow);

                let menuHead = document.createElement('th');
                menuHead.className = 'menuHead';
                menuHead.innerText = '메뉴';
                headRow.appendChild(menuHead);

                let priceHead = document.createElement('th');
                priceHead.className = 'priceHead';
                priceHead.innerText = '가격';
                headRow.appendChild(priceHead);

                for (let key in result.menu) {
                    let menuRow = document.createElement('tr');
                    menuRow.className = 'menuTr';
                    menuList.appendChild(menuRow);

                    let menuNode = document.createElement('td');
                    menuNode.innerText = key;
                    menuNode.className = 'menu';
                    menuRow.appendChild(menuNode);

                    let keyNode = document.createElement('td');
                    keyNode.innerText = result.menu[key];
                    keyNode.className = 'key';
                    menuRow.appendChild(keyNode);
                }
            }

            if (result.time.length > 0) {
                let operHead = document.createElement('span');
                operHead.className = 'operHead';
                operHead.innerText = '영업시간';
                panel.appendChild(operHead);

                let operationList = document.createElement('ul');
                operationList.className = 'operationList';
                panel.appendChild(operationList);

                for (let operCount = 0; operCount < result.time.length; operCount++) {
                    let operNode = document.createElement('li');
                    operNode.innerText = result.time[operCount];
                    operNode.className = 'operation';
                    operationList.appendChild(operNode);
                }
            }
        }
    };
    let url = "/info/id=" + id;
    request.open("GET", url, true);
    request.send();
}

function prevButtonPressed() {
    if (page > 1) {
        page--;
        getListInfo();
    }
    changePageNumber();
}

function nextButtonPressed() {
    page++;
    getListInfo();
    changePageNumber();
}

function changePageNumber() {
    document.getElementById('pageNum').innerText = page;
}