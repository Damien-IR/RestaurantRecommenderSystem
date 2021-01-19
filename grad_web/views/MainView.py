from django.http import HttpResponse
from django.shortcuts import render

from grad_web.function.predict_model import *
from grad_web.models import *

se = SingletonEngine()
engine = se.get_engine()
conn = se.get_conn()

st = SingletonTabnet()


def places_list(request):
    return render(request, 'places/map.html', {})


def json_list(request):
    req_dict = request.GET
    xmin, xmax, ymin, ymax, email, page = float(req_dict['xMin']), \
                                          float(req_dict['xMax']), \
                                          float(req_dict['yMin']), \
                                          float(req_dict['yMax']), \
                                          str(req_dict['email']), \
                                          int(req_dict['page'])

    # restQuerySet = Rest.objects.filter(xPos__range=(xmin, xmax), yPos__range=(ymin, ymax))[15 * (pg - 1): 15 * pg]
    # data = serialize("json", restQuerySet)
    # jsondata = json.loads(data)
    # for partitial_json in jsondata:
    #     del partitial_json['model']
    # jsondata = json.dumps(jsondata)

    # restQuerySet = Predict.objects.filter(xPos__range=(xmin, xmax), yPos__range=(ymin, ymax)).values()

    # head_pd = pd.read_sql(f'SELECT label.*,\
    #     serv_rest_avg.rest_count,\
    #     serv_rest_avg.avg_amount, serv_rest_avg.avg_clean, serv_rest_avg.avg_comfort,\
    #     serv_rest_avg.avg_crowded, serv_rest_avg.avg_delivery, serv_rest_avg.avg_fresh,\
    #     serv_rest_avg.avg_intime, serv_rest_avg.avg_menu, serv_rest_avg.avg_mood,\
    #     serv_rest_avg.avg_parking, serv_rest_avg.avg_price, serv_rest_avg.avg_reserve,\
    #     serv_rest_avg.avg_service, serv_rest_avg.avg_taste, serv_rest_avg.avg_review\
    #     FROM label, serv_rest_avg\
    #     WHERE (label."xPos" BETWEEN {xmin} AND {xmax}) \
    #     AND (label."yPos" BETWEEN {ymin} AND {ymax}) \
    #     and cast(label.id AS TEXT) = serv_rest_avg.restid', conn)

    head_pd = pd.read_sql(f"select distinct REST_DATA.*, REST_SCORE.rest_count, \
    REST_SCORE.avg_amount, REST_SCORE.avg_clean, REST_SCORE.avg_comfort, \
    REST_SCORE.avg_crowded, REST_SCORE.avg_delivery, REST_SCORE.avg_fresh, \
    REST_SCORE.avg_intime, REST_SCORE.avg_menu, REST_SCORE.avg_mood, \
    REST_SCORE.avg_parking, REST_SCORE.avg_price, REST_SCORE.avg_reserve, \
    REST_SCORE.avg_service, REST_SCORE.avg_taste, REST_SCORE.avg_review \
    from \
    (select * from cat \
        where cat.\"xPos\" between {xmin} and {xmax} \
        and \
        cat.\"yPos\" between {ymin} and {ymax}) as REST_DATA, \
    (select serv_rest_avg.* \
        from serv_rest_avg \
        where cast(serv_rest_avg.restid as int) in \
        (select cat.id from cat \
            where cat.\"xPos\" between {xmin} and {xmax} \
            and \
            cat.\"yPos\" between {ymin} and {ymax})) as REST_SCORE \
    where REST_DATA.id = cast(REST_SCORE.restid as int)", conn)

    # tail_pd = pd.read_sql(f"select serv_cust_avg.cust_count, \
    #     serv_cust_avg.cust_amount, serv_cust_avg.cust_clean, serv_cust_avg.cust_comfort, \
    #     serv_cust_avg.cust_crowded, serv_cust_avg.cust_delivery, serv_cust_avg.cust_fresh, \
    #     serv_cust_avg.cust_intime, serv_cust_avg.cust_menu, serv_cust_avg.cust_mood, \
    #     serv_cust_avg.cust_parking, serv_cust_avg.cust_price, serv_cust_avg.cust_reserve, \
    #     serv_cust_avg.cust_service, serv_cust_avg.cust_taste, serv_cust_avg.cust_review \
    #     FROM serv_cust_avg WHERE serv_cust_avg.custid IN \
    #     (SELECT account.id FROM account WHERE account.email = \'{email}\')", conn)

    tail_pd = pd.read_sql(f'select * \
                          from serv_cust_avg \
                          where cast(serv_cust_avg.custid as int) in \
                          (select account.\"id\" \
                          from account \
                          where account.\"email\" = \'{email}\')', conn)

    tail_pd = pd.concat([tail_pd] * len(head_pd), ignore_index=True)

    pred_data = pd.concat([head_pd, tail_pd], axis=1)

    pred_result = st.predict(pred_data)
    pred_result = [i[0] for i in pred_result]

    pred_data['pred_score'] = pred_result
    pred_data.sort_values(by=['id'], axis=0, ascending=True, inplace=True)

    rest_data = Rest.objects.filter(id__in=pred_data['id'].tolist()).values()
    for i in rest_data:
        i['pred_score'] = float(pred_data[pred_data['id'] == i['id']]['pred_score'])
    rest_data = sorted(rest_data, key=lambda data: data['pred_score'])
    rest_json = json.dumps(list(rest_data))
    return HttpResponse(rest_json, content_type='application/json')
