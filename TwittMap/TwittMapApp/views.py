from django.shortcuts import render
from tweepy import Stream
from tweepy import OAuthHandler
from tweepy.streaming import StreamListener
import json
from elasticsearch import Elasticsearch, RequestsHttpConnection
import time
import geocoder
from django.views.decorators.csrf import csrf_protect
from requests_aws4auth import AWS4Auth

# consumer key, consumer secret, access token, access secret.
ckey = "YOUR_TWITTER_CONSUMER_KEY"
csecret = "YOUR_TWITTER_CONSUMER_SECRET_KEY"
atoken = "YOUR_TWITTER_ACCESS_TOKEN"
asecret = "YOUR_TWITTER_ACCESS_SECRET_TOKEN"

# create instance of elasticsearch
host = 'YOUR_AWS_ELASTICSEARCH_DOMAIN'
awsauth = AWS4Auth('AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'us-east-1', 'es')


def home(request):
    return render(request, 'navbar.php')


@csrf_protect
def gettweet(request):
    # import twitter keys and tokens
    pass_list = {}
    tweets = []
    print("this is getweet")

    # create instance of elasticsearch
    # es=Elasticsearch()
    es = Elasticsearch(
        hosts=[{'host': host, 'port': 443}],
        http_auth=awsauth,
        use_ssl=True,
        verify_certs=True,
        connection_class=RequestsHttpConnection
    )

    query = str(request.POST.get('myword'))

    # query = str(request.POST)
    class TweetStreamListener(StreamListener):
        i = 0

        def __init__(self, time_limit=10):
            self.start_time = time.time()
            self.limit = time_limit

        # on success
        def on_data(self, data):

            # decode json
            dict_data = json.loads(data)
            print(self.i)
            if (time.time() - self.start_time) < self.limit:
                if 'user' in dict_data and dict_data['user']['location']:
                    try:
                        es.index(index="sentiment",
                                 doc_type="test-type",
                                 id=self.i,
                                 body={"author": dict_data["user"]["screen_name"],
                                       "date": dict_data["created_at"],
                                       "location": dict_data['user']['location'],
                                       "lat": geocoder.google(dict_data['user']['location']).latlng[0],
                                       "lng": geocoder.google(dict_data['user']['location']).latlng[1],
                                       "message": dict_data["text"]
                                       })

                        print(es.get(index='sentiment', doc_type='test-type', id=self.i))

                        self.i += 1

                    except:

                        pass
                    return True
            else:
                return False

        # on failure
        def on_error(self, status):
            print(status)

        def on_timeout(self):
            print("Timeout")

    # create instance of the tweepy tweet stream listener
    listener = TweetStreamListener()

    # set twitter keys/tokens
    auth = OAuthHandler(ckey, csecret)
    auth.set_access_token(atoken, asecret)

    # create instance of the tweepy stream
    stream = Stream(auth, listener)
    stream.timeout = 10

    # search twitter for particular keyword
    try:
        stream.filter(track=[query])
    except:
        print(listener.i)

    print(listener.i)
    '''
    for i in range(10):
        pass_list['tweet'].append(es.get(index="sentiment", doc_type='test-type', id=i))
    '''
    for tweetno in range(listener.i):
        tweets.append(es.get(index='sentiment', doc_type='test-type', id=tweetno))

    print(tweets)
    pass_list["mytweets"] = tweets
    pass_list_final = json.dumps(pass_list)
    return render(request, "index.php", {"my_data": pass_list_final})


"""

pass_list = {}
tweets = []
print("this is getweet")

# create instance of elasticsearch
# es=Elasticsearch()
es = Elasticsearch(
    hosts=[{'host': host, 'port': 443}],
    http_auth=awsauth,
    use_ssl=True,
    verify_certs=True,
    connection_class=RequestsHttpConnection
)

# query = str(request.POST.get('myword'))


# query = str(request.POST)
class TweetStreamListener(StreamListener):
    i = 0

    def __init__(self, time_limit=10):
        self.start_time = time.time()
        self.limit = time_limit

    # on success
    def on_data(self, data):

        # decode json
        dict_data = json.loads(data)
        print(self.i)
        if (time.time() - self.start_time) < self.limit:
            if 'user' in dict_data and dict_data['user']['location']:
                try:
                    es.index(index="sentiment",
                             doc_type="test-type",
                             id=self.i,
                             body={"author": dict_data["user"]["screen_name"],
                                   "date": dict_data["created_at"],
                                   "location": dict_data['user']['location'],
                                   "lat": geocoder.google(dict_data['user']['location']).latlng[0],
                                   "lng": geocoder.google(dict_data['user']['location']).latlng[1],
                                   "message": dict_data["text"]
                                   })

                    print(es.get(index='sentiment', doc_type='test-type', id=self.i))

                    self.i += 1

                except:

                    pass
                return True
        else:
            return False

    # on failure
    def on_error(self, status):
        print(status)

    def on_timeout(self):
        print("Timeout")


# create instance of the tweepy tweet stream listener
listener = TweetStreamListener()

# set twitter keys/tokens
auth = OAuthHandler(ckey, csecret)
auth.set_access_token(atoken, asecret)

# create instance of the tweepy stream
stream = Stream(auth, listener)
stream.timeout = 10

# search twitter for particular keyword
try:
    stream.filter(track=['US'])
except:
    print(listener.i)

print(listener.i)
'''
for i in range(10):
    pass_list['tweet'].append(es.get(index="sentiment", doc_type='test-type', id=i))
'''
for tweetno in range(listener.i):
    tweets.append(es.get(index='sentiment', doc_type='test-type', id=tweetno))

print(tweets)
pass_list["mytweets"] = tweets
pass_list_final = json.dumps(pass_list)

"""
