기반 기술은 PHP/mysql 기반으로 개발 해줘 

요구 사항은 openapi 기반의 명세서를 만들어주고 해당 명세서를 기반으로 개발 해줘

명세서 기반으로 backend에는 api 별로 함수를 구현해 주고 

frontend의 웹페이지는 backend의 api를 참조해서 구현하도록 해서 frontend와 backend 를 분리해줘 



[ 디렉토리 설명 ]
 
/openapi : 기능 별로 openapi 명세서를 분리 해서 만들어줘  
/conf  : 설정 화일  
/comon :  공통 라이브러리 , class 형태로 구성 
/lib_sql : sql 관련 기능은 sql query 는 Table 단위로 구성  해줘 
/table : table생성 sql 화일 $(table이름).tbl.sql , 초기 값은 $(table이름).value.sql, 인덱스는 $(table이름).idx.sql 로 정리 해줘
/backend : openapi 기반으로 함수만들기  , 기능별로 디렉토리를 만들어 관리 해줘 
/fronend : html 화면 페이지 , 기능 별로 디렉토리를 만들어 관리 해줘 

