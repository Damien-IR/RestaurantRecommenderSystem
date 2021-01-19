from typing import Dict

from pytorch_tabnet.tab_model import TabNetRegressor
import json
import pickle
import numpy as np
import pandas as pd
import glob

from sklearn.preprocessing import LabelEncoder
from simpletransformers.classification import ClassificationModel
import torch
from sqlalchemy import create_engine


class Singleton(object):
    _instance = None

    def __new__(cls, *args, **kwargs):
        if not isinstance(cls._instance, cls):
            cls._instance = object.__new__(cls)
        return cls._instance


class Tabnet:
    def __init__(self):
        with open("grad_web/function/cat_dims.pkl", "rb") as fp:
            self.cat_dims = pickle.load(fp)
            fp.close()
        with open("grad_web/function/cat_idxs.pkl", "rb") as fp:
            self.cat_idxs = pickle.load(fp)
            fp.close()
        with open("grad_web/function/features.pkl", "rb") as fp:
            self.features = pickle.load(fp)
            fp.close()
        self.model = TabNetRegressor(n_a=64, n_d=64, cat_dims=self.cat_dims, cat_idxs=self.cat_idxs)
        self.model.load_model("grad_web/function/tabnet_rm_c2.zip")

    def predict(self, data):
        if type(data) == np.ndarray:
            return self.predict(data)
        elif type(data) == pd.DataFrame:
            # concat = list(data.columns[data.dtypes == object]) + ['hasBooking', 'hasNpay'] \
            #          + [c for c in data.columns if 'label_' in c]
            # for col in concat:
            #     l_enc = LabelEncoder()
            #     data[col] = data[col].fillna("Null")
            #     data[col] = l_enc.fit_transform(data[col].values)

            return self.model.predict(data[self.features].values)


class SingletonTabnet(Singleton, Tabnet):
    pass


def pred_fix(data):
    if data == 0:
        return data
    elif data == 1:
        return -1
    elif data == 2:
        return 1


def models_predict(models: Dict, reviews: pd.Series):
    result_df = pd.DataFrame()
    reviews = reviews.map(lambda x: '' if x is None else x)
    for model_name, model_data in models.items():
        result_df[model_name] = model_data.predict(reviews.tolist())[0]
    return result_df


def model_predict(model: ClassificationModel, reviews: pd.Series):
    reviews = reviews.map(lambda x: '' if x is None else x)
    result_series = model.predict(reviews.tolist())[0]
    return result_series


class ClsModels:
    def __init__(self):
        self.models = [
            ClassificationModel(
                model_type="electra",
                model_name=i,
                num_labels=3,
                use_cuda=torch.cuda.is_available(),
                args=dict(sliding_window=False,
                          stride=0.9, fp16=False, train_batch_size=8,
                          test_batch_size=8, evaluate_during_training=True,
                          use_multiprocessing=False, process_count=1, thread_count=1,
                          dataloader_num_workers=1,
                          max_seq_length=128, manual_seed=99)
            )
            for i in glob.glob("function/models/*")
        ]

    def predict(self, data):
        pred = [i.predict(data)[0] for i in self.models]
        return [pred_fix(i) for i in pred]


class SingletonClsModels(Singleton, ClsModels):
    pass


class Engine:
    def __init__(self):
        self.engine = create_engine("")
        self.conn = self.engine.connect()

    def get_engine(self=None):
        return self.engine

    def get_conn(self):
        return self.conn


class SingletonEngine(Singleton, Engine):
    pass
