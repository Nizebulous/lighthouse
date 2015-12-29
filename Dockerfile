FROM python:2.7
MAINTAINER <dhites@makespace.com>

WORKDIR /code/

COPY requirements.txt /code/
RUN pip install -r requirements.txt

COPY . /code/

EXPOSE 5000

CMD python app.py
